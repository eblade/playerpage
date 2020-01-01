class Track extends HTMLElement {
    get title() {
	return this.getAttribute('title');
    }

    set title(val) {
	this.setAttribute('title', val);
    }

    get proxy() {
	return this.getAttribute('proxy');
    }

    set proxy(val) {
	this.setAttribute('proxy', val);
    }

    get flac() {
	return this.getAttribute('flac');
    }

    set flac(val) {
	this.setAttribute('flac', val);
    }

    get pdf() {
	return this.getAttribute('pdf');
    }

    set pdf(val) {
	this.setAttribute('pdf', val);
    }

    get active() {
	return this.hasAttribute('active');
    }

    set active(val) {
	var title = this.shadowRoot.getElementById("title");
	if (val) {
	    this.setAttribute('active', '');
	    title.className = "active";
	} else {
	    this.removeAttribute('active');
	    title.className = "";
	}
    }

    constructor() {
	super();
    }

    connectedCallback() {
	let tmpl = document.getElementById('track-template');
	let shadowRoot = this.attachShadow({mode: 'open'});
	let clone = tmpl.content.cloneNode(true);
	shadowRoot.appendChild(clone);
	let title = shadowRoot.getElementById('title');
	title.innerText = this.title;

	title.addEventListener('click', e => {
	    player.track = this;
	    player.play();
	});

	let container = shadowRoot.getElementById('container');
	let createLink = function(filename, extension) {
	    let span = document.createElement('span');
	    span.className = "download";
	    span.innerHTML = '<a class="download" href="media/'
		+ filename + '" download>' + extension + '</a>';
	    container.appendChild(span);
	};
	if (this.flac) {
	    createLink(this.flac, 'flac');
	}
	if (this.pdf) {
	    createLink(this.pdf, 'pdf');
	}

    }
}

window.customElements.define('x-track', Track);


function formatTime(seconds) {
    var sec_num = parseInt(seconds, 10)
    var hours   = Math.floor(sec_num / 3600)
    var minutes = Math.floor(sec_num / 60) % 60
    var seconds = sec_num % 60

    return [hours,minutes,seconds]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v,i) => v !== "00" || i > 0)
        .join(":")
}

class Player {
    get track() {
	return this._track;
    }

    set track(track) {
	this._track = track;

	var playerTitle = document.getElementById("playertitle");
	playerTitle.innerText = track.title || track.proxy; 

	this._audio.getElementsByTagName("source")[0].src = "media/" + track.proxy;
	this._audio.load();

	var track_elements = document.body.getElementsByTagName("x-track");
	for (var i = 0; i < track_elements.length; i++) {
	    var track_element = track_elements[i];
	    track_element.active = (track_element === this.track);
	}

    }
    
    play(track) {
	this._audio.play();
    };

    pause() {
	this._audio.pause();
    }

    toggle() {
	if (this._audio.paused) {
	    this._audio.play();
	} else {
	    this._audio.pause();
	}
    }

    set status(status) {
	var playerStatus = document.getElementById("playerstatus");
	playerStatus.innerText = status; 
    }

    update_time(position, duration) {
	var playerDuration = document.getElementById("playerduration");
	playerDuration.innerHTML = '<b>' + formatTime(position) + '</b> / ' + formatTime(duration); 
    }

    first() {
	var firstTrack = document.body.getElementsByTagName("x-track")[0];
	this.track = firstTrack;
    }

    next() {
	if (this._track === null) {
	    this.first();
	    return false;
	}
	
	var candidate = this._track.nextElementSibling;
	while (candidate) {
	    if (candidate instanceof Track) {
		this.track = candidate;
		return true;
	    }

	    candidate = candidate.nextElementSibling;
	}

	return false;
    }

    constructor(audio) {
	this._track = null;
	this._audio = audio;
	var that = this;

	this._audio.addEventListener("play", function(event) {
	    that.status = "Playing";
	});
	this._audio.addEventListener("playing", function(event) {
	    that.status = "Playing";
	});
	this._audio.addEventListener("pause", function(event) {
	    that.status = "Paused";
	});
	this._audio.addEventListener("waiting", function(event) {
	    that.status = "Waiting";
	});
	this._audio.addEventListener("stalled", function(event) {
	    that.status = "Gave up";
	});
	this._audio.addEventListener("durationchange", function(event) {
	    that.update_time(this.currentTime, this.duration);
	});
	this._audio.addEventListener("timeupdate", function(event) {
	    that.update_time(this.currentTime, this.duration);
	});
	this._audio.addEventListener("ended", function(event) {
	    that.next() && that.play();
	});
    }
}

var player;

document.addEventListener("DOMContentLoaded", function() {
    player = new Player(document.body.getElementsByTagName('audio')[0]);
    player.first();

    var panel = document.getElementById('playerpanel');
    panel.addEventListener('click', function(event) {
	player.toggle();
    });

    var nextButton = document.getElementById('playernext');
    nextButton.addEventListener('click', function(event) {
	player.next() && player.play();
	event.stopPropagation();
    });
});
