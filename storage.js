(function(){
	if(!window.SMAI){ window.SMAI = {}; }

	var REPORTS_KEY = 'smai_reports_v1';
	var AREAS_KEY = 'smai_areas_v2';

	function loadReports(){
		try { return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]'); } catch(e){ return []; }
	}
	function saveReports(reports){
		localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
	}

	function loadAreas(){
		try { return JSON.parse(localStorage.getItem(AREAS_KEY) || 'null'); } catch(e){ return null; }
	}
	function defaultAreas(){
		// Example coordinates; replace with your city/areas if needed
		return [
			{ id:'A1', name:'Area 1', score: 0, lat: 17.3850, lon: 78.4867 },
			{ id:'A2', name:'Area 2', score: 0, lat: 17.4401, lon: 78.3489 },
			{ id:'A3', name:'Area 3', score: 0, lat: 17.4139, lon: 78.4983 },
			{ id:'A4', name:'Area 4', score: 0, lat: 17.4557, lon: 78.5167 },
			{ id:'A5', name:'Area 5', score: 0, lat: 17.4213, lon: 78.4570 },
			{ id:'A6', name:'Area 6', score: 0, lat: 17.3840, lon: 78.4860 },
			{ id:'A7', name:'Area 7', score: 0, lat: 17.3753, lon: 78.4744 },
			{ id:'A8', name:'Area 8', score: 0, lat: 17.4420, lon: 78.5010 }
		];
	}
	function ensureAreas(){
		var areas = loadAreas();
		if(!areas || !Array.isArray(areas) || areas.length === 0){
			areas = defaultAreas();
			localStorage.setItem(AREAS_KEY, JSON.stringify(areas));
		} else {
			// If old structure exists in older key, migrate
			try {
				var old = JSON.parse(localStorage.getItem('smai_areas_v1') || 'null');
				if(Array.isArray(old) && (!areas || areas.length === 0)){
					areas = old.map(function(a, i){ return {
						id: a.id, name: a.name, score: a.score || 0,
						lat: defaultAreas()[i % defaultAreas().length].lat,
						lon: defaultAreas()[i % defaultAreas().length].lon
					}; });
					localStorage.setItem(AREAS_KEY, JSON.stringify(areas));
				}
			} catch(e){}
			// Ensure each area has lat/lon
			var defs = defaultAreas();
			areas.forEach(function(a, i){ if(a.lat == null || a.lon == null){ a.lat = defs[i % defs.length].lat; a.lon = defs[i % defs.length].lon; } });
			localStorage.setItem(AREAS_KEY, JSON.stringify(areas));
		}
		return areas;
	}
	function saveAreas(areas){
		localStorage.setItem(AREAS_KEY, JSON.stringify(areas));
	}

	function getAreaById(id){
		return ensureAreas().find(function(a){ return a.id === id; });
	}

	function addReport(report){
		var reports = loadReports();
		reports.unshift(report);
		saveReports(reports);
		return report;
	}

	function clearLocalData(){
		localStorage.removeItem(REPORTS_KEY);
		localStorage.removeItem(AREAS_KEY);
	}

	function exportAll(){
		var data = {
			reports: loadReports(),
			areas: ensureAreas()
		};
		return JSON.stringify(data, null, 2);
	}

	function importAll(json){
		var data = JSON.parse(json);
		if(data && Array.isArray(data.reports)) saveReports(data.reports);
		if(data && Array.isArray(data.areas)) saveAreas(data.areas);
	}

	window.SMAI.storage = {
		loadReports: loadReports,
		saveReports: saveReports,
		ensureAreas: ensureAreas,
		saveAreas: saveAreas,
		getAreaById: getAreaById,
		addReport: addReport,
		clearLocalData: clearLocalData,
		exportAll: exportAll,
		importAll: importAll
	};
})();
