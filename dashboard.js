(function(){
	var storage = window.SMAI.storage;
	var ai = window.SMAI.ai;

	function levelClass(score){ return ai.classifyLevel(score||0); }

	function renderMap(){
		var container = document.getElementById('area-map');
		container.innerHTML = '';
		var areas = storage.ensureAreas();
		areas.forEach(function(a){
			var level = levelClass(a.score);
			var tile = document.createElement('div');
			tile.className = 'area-tile ' + level;
			tile.innerHTML = '<div class="name">'+a.name+'</div>'+
				'<div class="score">Score: '+(a.score||0)+'</div>'+
				'<div class="marker '+level+'"></div>'+
				'<div class="tile-actions"><button class="btn btn-secondary btn-small">View Reports</button></div>';

			// Open Google Maps on tile click
			tile.addEventListener('click', function(ev){
				if(ev.target && ev.target.tagName === 'BUTTON'){ return; }
				var url = 'https://www.google.com/maps/search/?api=1&query='+(a.lat||0)+','+(a.lon||0);
				window.open(url, '_blank');
			});
			// Filter reports for this area
			tile.querySelector('button').addEventListener('click', function(ev){
				ev.stopPropagation();
				filterReportsByArea(a.id);
			});
			container.appendChild(tile);
		});
	}

	function renderReports(){
		var ul = document.getElementById('report-list');
		if(!ul){ return; }
		ul.innerHTML = '';
		var reports = storage.loadReports().slice();
		reports.sort(function(a,b){ return new Date(b.createdAt) - new Date(a.createdAt); });
		reports.forEach(function(r){
			var li = document.createElement('li');
			li.className = 'report-item';
			li.setAttribute('data-area', r.areaId);
			var imgHtml = r.imageData ? '<img src="'+r.imageData+'" alt="thumbnail"/>' : '<img alt="no image"/>';
			var mapLink = (r.lat!=null && r.lon!=null) ? '<a target="_blank" href="https://www.google.com/maps/search/?api=1&query='+r.lat+','+r.lon+'">Open map</a>' : '';
			li.innerHTML = imgHtml +
				'<div>'+
					'<div><strong>'+escapeHtml(r.title||'')+'</strong></div>'+
					'<div class="meta">'+r.category+' · Score '+(r.severityScore||0)+' · '+new Date(r.createdAt).toLocaleString()+' '+mapLink+'</div>'+
					'<div>' + escapeHtml(r.description||'') + '</div>'+
				'</div>';
			ul.appendChild(li);
		});
		addShowAllButton();
	}

	function addShowAllButton(){
		var ul = document.getElementById('report-list');
		if(!ul){ return; }
		var btn = document.createElement('button');
		btn.className = 'btn btn-secondary';
		btn.textContent = 'Show All Reports';
		btn.onclick = function(){ Array.prototype.forEach.call(ul.children, function(li){ li.style.display = ''; }); };
		var wrapper = document.createElement('div');
		wrapper.style.marginTop = '8px';
		wrapper.appendChild(btn);
		ul.parentElement.appendChild(wrapper);
	}

	function filterReportsByArea(areaId){
		var ul = document.getElementById('report-list');
		if(!ul){ return; }
		Array.prototype.forEach.call(ul.children, function(li){
			li.style.display = (li.getAttribute('data-area') === areaId) ? '' : 'none';
		});
	}

	function escapeHtml(str){
		return String(str).replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]); });
	}

	function maybeShowAdmin(){
		var session = window.SMAI.getSession();
		if(session && session.role === 'admin'){
			var adminEls = document.querySelectorAll('.admin-only');
			for(var i=0;i<adminEls.length;i++){ adminEls[i].style.display = ''; }
		}
	}

	document.addEventListener('DOMContentLoaded', function(){
		renderMap();
		renderReports();
		maybeShowAdmin();

		var recompute = document.getElementById('btn-recompute');
		if(recompute){
			recompute.onclick = function(){ ai.recomputeAreaScores(); renderMap(); };
		}

		var btnExport = document.getElementById('btn-export');
		if(btnExport){
			btnExport.onclick = function(){
				var json = storage.exportAll();
				var blob = new Blob([json], { type: 'application/json' });
				var a = document.createElement('a');
				a.href = URL.createObjectURL(blob);
				a.download = 'sanitary-map-data.json';
				a.click();
				URL.revokeObjectURL(a.href);
			};
		}

		var importFile = document.getElementById('import-file');
		if(importFile){
			importFile.onchange = function(){
				var f = importFile.files && importFile.files[0];
				if(!f) return;
				var reader = new FileReader();
				reader.onload = function(){
					storage.importAll(String(reader.result));
					ai.recomputeAreaScores();
					renderMap();
					renderReports();
				};
				reader.readAsText(f);
			};
		}

		var btnClear = document.getElementById('btn-clear');
		if(btnClear){
			btnClear.onclick = function(){
				if(!confirm('Clear all local data? This removes local reports and area scores.')) return;
				storage.clearLocalData();
				ai.recomputeAreaScores();
				renderMap();
				renderReports();
				alert('Local data cleared. Backend submissions remain accessible via Admin Data if configured.');
			};
		}

		var btnClearBackend = document.getElementById('btn-clear-backend');
		if(btnClearBackend){
			btnClearBackend.onclick = function(){
				var backendUrl = (window.SMAI.config && window.SMAI.config.backendUrl) || '';
				if(!backendUrl){ alert('Backend is not configured.'); return; }
				if(!confirm('This will permanently delete ALL backend submissions. Continue?')) return;
				var key = prompt('Type ADMIN KEY to confirm (ask your setup):');
				if(!key){ return; }
				fetch(backendUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ type: 'deleteAll', adminKey: key })
				}).then(function(r){ return r.json().catch(function(){ return {}; }); })
				.then(function(res){
					if(res && res.ok){
						alert('Backend data cleared.');
					} else {
						alert('Failed to clear backend data.');
					}
				}).catch(function(){ alert('Failed to clear backend data.'); });
			};
		}
	});
})();
