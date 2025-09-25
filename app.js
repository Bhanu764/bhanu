(function(){
	if(!window.SMAI){ window.SMAI = {}; }

	// Configure this to your backend endpoint (leave empty to disable backend):
	// Example (Google Apps Script web app URL):
	// window.SMAI.config.backendUrl = 'https://script.google.com/macros/s/AKfycbx.../exec';
	window.SMAI.config = window.SMAI.config || { backendUrl: '' };

	var SESSION_KEY = 'smai_session';
	var qs = function(sel){ return document.querySelector(sel); };

	function getSession(){
		try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch(e){ return null; }
	}
	function setSession(session){
		localStorage.setItem(SESSION_KEY, JSON.stringify(session));
	}
	function clearSession(){ localStorage.removeItem(SESSION_KEY); }

	function updateNav(){
		var session = getSession();
		var btnLogout = qs('#btn-logout');
		if(btnLogout){
			btnLogout.style.display = session ? '' : 'none';
			btnLogout.onclick = function(){ clearSession(); window.location.href = 'index.html'; };
		}
	}

	// PWA install handling
	var deferredPrompt = null;
	function setupInstall(){
		window.addEventListener('beforeinstallprompt', function(e){
			e.preventDefault();
			deferredPrompt = e;
			var btn = document.getElementById('btn-install');
			if(btn){ btn.style.display = ''; }
		});
		var btnInstall = document.getElementById('btn-install');
		if(btnInstall){
			btnInstall.onclick = function(){
				if(!deferredPrompt) return;
				deferredPrompt.prompt();
				deferredPrompt.userChoice.finally(function(){ deferredPrompt = null; btnInstall.style.display = 'none'; });
			};
		}
	}

	function registerServiceWorker(){
		if('serviceWorker' in navigator){
			navigator.serviceWorker.register('sw.js').catch(function(){});
		}
	}

	window.SMAI.getSession = getSession;
	window.SMAI.setSession = setSession;
	window.SMAI.clearSession = clearSession;

	document.addEventListener('DOMContentLoaded', function(){
		updateNav();
		setupInstall();
		registerServiceWorker();
	});
})();
