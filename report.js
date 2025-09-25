(function(){
	var storage = window.SMAI.storage;
	var ai = window.SMAI.ai;

	function distance2(lat1, lon1, lat2, lon2){
		var dlat = (lat1 - lat2);
		var dlon = (lon1 - lon2);
		return dlat*dlat + dlon*dlon;
	}

	function compressImage(file, maxDim, quality, cb){
		var reader = new FileReader();
		reader.onload = function(){
			var img = new Image();
			img.onload = function(){
				var w = img.width, h = img.height;
				if(w > h){ if(w > maxDim){ h = Math.round(h * (maxDim / w)); w = maxDim; } }
				else { if(h > maxDim){ w = Math.round(w * (maxDim / h)); h = maxDim; } }
				var canvas = document.createElement('canvas');
				canvas.width = w; canvas.height = h;
				var ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, w, h);
				try {
					var dataUrl = canvas.toDataURL('image/jpeg', quality);
					cb(dataUrl);
				} catch(err){
					cb(String(reader.result));
				}
			};
			img.onerror = function(){ cb(String(reader.result)); };
			img.src = String(reader.result);
		};
		reader.readAsDataURL(file);
	}

	document.addEventListener('DOMContentLoaded', function(){
		// populate area select
		var areaSelect = document.getElementById('area');
		var areas = storage.ensureAreas();
		areas.forEach(function(a){
			var opt = document.createElement('option');
			opt.value = a.id; opt.textContent = a.name;
			areaSelect.appendChild(opt);
		});

		// Try geolocation to auto-select nearest area
		if(navigator.geolocation){
			navigator.geolocation.getCurrentPosition(function(pos){
				var lat = pos.coords.latitude, lon = pos.coords.longitude;
				var best = null, bestD = Infinity;
				areas.forEach(function(a){
					var d2 = distance2(lat, lon, a.lat||0, a.lon||0);
					if(d2 < bestD){ bestD = d2; best = a; }
				});
				if(best){ areaSelect.value = best.id; }
			}, function(){ /* ignore */ }, { enableHighAccuracy:true, maximumAge:60000, timeout:8000 });
		}

		var form = document.getElementById('report-form');
		form.addEventListener('submit', function(e){
			e.preventDefault();
			var title = document.getElementById('title').value.trim();
			var description = document.getElementById('description').value.trim();
			var category = document.getElementById('category').value;
			var areaId = document.getElementById('area').value;
			var fileInput = document.getElementById('image');

			function persist(imageData, geo){
				var report = {
					id: 'R' + Date.now(),
					title: title,
					description: description,
					category: category,
					areaId: areaId,
					imageData: imageData || '',
					createdAt: new Date().toISOString(),
					lat: geo && geo.lat || null,
					lon: geo && geo.lon || null
				};
				report.severityScore = ai.scoreReportSeverity(report);

				// Save locally first
				storage.addReport(report);
				ai.recomputeAreaScores();

				// Send to backend if configured
				var backendUrl = (window.SMAI.config && window.SMAI.config.backendUrl) || '';
				if(backendUrl){
					try {
						fetch(backendUrl, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ type: 'report', payload: report })
						});
					} catch(err) { /* ignore */ }
				}

				document.getElementById('report-success').style.display = '';
				form.reset();
			}

			function withGeo(cb){
				if(navigator.geolocation){
					navigator.geolocation.getCurrentPosition(function(pos){
						cb({ lat: pos.coords.latitude, lon: pos.coords.longitude });
					}, function(){ cb(null); }, { enableHighAccuracy:true, maximumAge:60000, timeout:8000 });
				} else { cb(null); }
			}

			var file = fileInput && fileInput.files && fileInput.files[0];
			if(file){
				compressImage(file, 1280, 0.7, function(dataUrl){ withGeo(function(g){ persist(dataUrl, g); }); });
			} else {
				withGeo(function(g){ persist('', g); });
			}
		});
	});
})();
