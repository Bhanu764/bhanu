(function(){
	if(!window.SMAI){ window.SMAI = {}; }

	// Simple keyword-based severity scoring: 0-100
	function scoreReportSeverity(report){
		var text = ((report.title||'') + ' ' + (report.description||'')).toLowerCase();
		var category = report.category || '';
		var score = 10; // base

		var weights = [
			{ k: 'overflow', w: 30 },
			{ k: 'stagnant', w: 30 },
			{ k: 'blocked', w: 25 },
			{ k: 'sewage', w: 40 },
			{ k: 'toilet', w: 15 },
			{ k: 'mosquito', w: 25 },
			{ k: 'smell', w: 15 },
			{ k: 'garbage', w: 20 },
			{ k: 'drain', w: 20 },
			{ k: 'water', w: 15 }
		];
		for(var i=0;i<weights.length;i++){
			if(text.indexOf(weights[i].k) !== -1){ score += weights[i].w; }
		}
		if(category === 'drain') score += 15;
		if(category === 'water') score += 20;
		if(category === 'garbage') score += 10;
		if(category === 'toilet') score += 10;

		if(report.imageData){ score += 10; }
		if(score > 100) score = 100;
		if(score < 0) score = 0;
		return Math.round(score);
	}

	function classifyLevel(score){
		if(score >= 70) return 'high';
		if(score >= 40) return 'med';
		return 'low';
	}

	function recomputeAreaScores(){
		var areas = window.SMAI.storage.ensureAreas();
		var reports = window.SMAI.storage.loadReports();
		var byArea = {};
		areas.forEach(function(a){ byArea[a.id] = []; });
		reports.forEach(function(r){
			var s = r.severityScore != null ? r.severityScore : scoreReportSeverity(r);
			if(!byArea[r.areaId]) byArea[r.areaId] = [];
			byArea[r.areaId].push(s);
		});
		areas.forEach(function(a){
			var arr = byArea[a.id] || [];
			var avg = 0;
			for(var i=0;i<arr.length;i++){ avg += arr[i]; }
			avg = arr.length ? Math.round(avg / arr.length) : 0;
			a.score = avg;
		});
		window.SMAI.storage.saveAreas(areas);
		return areas;
	}

	window.SMAI.ai = {
		scoreReportSeverity: scoreReportSeverity,
		classifyLevel: classifyLevel,
		recomputeAreaScores: recomputeAreaScores
	};
})();
