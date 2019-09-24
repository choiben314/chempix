function login() {
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().useDeviceLanguage();

  provider.setCustomParameters({
    prompt: 'select_account'
  });

  firebase.auth().signInWithRedirect(provider);

  firebase.auth().getRedirectResult().then(function(result) {
    if (result.credential) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = result.credential.accessToken;
      // ...
    }
    return result.user;
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });
}

var valid_user = false;

const loginButton = document.getElementById('login');
const signOutButton = document.getElementById('sign-out');

const menu = document.getElementById('menu');
const takePhotosButton = document.getElementById('take-photos');
const rewardsButton = document.getElementById('rewards');
const statsButton = document.getElementById('stats');

loginButton.addEventListener('click', event => {
  var user = login();
  document.getElementById('loading').style.display = 'inline-block'
  loginButton.style.display = 'none'
});

signOutButton.addEventListener('click', event => {
  firebase.auth().signOut();
});

takePhotosButton.addEventListener('click', event => {
  document.getElementById('splash').style.display = 'none'
  document.getElementById('photo').style.display = 'inline-block'
  document.getElementById('home').style.display = 'inline-block'
});

rewardsButton.addEventListener('click', event => {
  document.getElementById('splash').style.display = 'none'
  document.getElementById('reward').style.display = 'inline-block'
  document.getElementById('home').style.display = 'inline-block'
});

statsButton.addEventListener('click', event => {
  document.getElementById('splash').style.display = 'none'
  document.getElementById('stat').style.display = 'inline-block'
  document.getElementById('home').style.display = 'inline-block'
});

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    if (user.email.endsWith("stanford.edu")) {
      valid_user = true;
      signOutButton.style.display = 'inline-block';
      loginButton.style.display = 'none';
      menu.style.display = 'inline-block';
      document.getElementById('loading').style.display = 'none'

    } else {
      alert("Error: Must use stanford.edu email.");
      firebase.auth().signOut();
    }
  } else {
    // No user is signed in.
    valid_user = false;
    signOutButton.style.display = 'none';
    loginButton.style.display = 'inline-block';
    menu.style.display = 'none';
    document.getElementById('loading').style.display = 'none'
  }
});

const container = document.getElementById('container');
const player = document.getElementById('player');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const captureButton = document.getElementById('capture');
const submitButton = document.getElementById('submit');
const switchButton = document.getElementById('switch');
const homeButton = document.getElementById('home');

// container.width = window.innerWidth * 0.85;
player.width = window.innerWidth * 0.85;
player.height = window.innerHeight * 0.6;

var cam = 0; // 0 for selfie, 1 for rear

const env_constraints = {
  video: {facingMode: { 
    exact: 'environment'
  }}
};

const user_constraints = {
  video: {facingMode: { 
    exact: 'user'
  }}
};

player.addEventListener( "loadedmetadata", function (e) {
    // Ratio of the video's intrisic dimensions
    var videoRatio = this.videoWidth / this.videoHeight;
    console.log(this.videoWidth);
    console.log(this.videoHeight);
    // The width and height of the video element
    var width = this.offsetWidth, height = this.offsetHeight;
    // The ratio of the element's width to its height
    var elementRatio = width / height;
    // If the video element is short and wide
    if(elementRatio > videoRatio) width = height * videoRatio;
    // It must be tall and thin, or exactly equal to the original ratio
    else height = width / videoRatio;
    canvas.width = width;
    canvas.height = height;
}, false );

captureButton.addEventListener('click', () => {
  if (captureButton.innerHTML == "Take again") {
    canvas.style.display = 'none'
    player.style.display = 'inline-block'
    submitButton.style.display = 'none'
    captureButton.innerHTML = "Capture"
    switchButton.style.display = 'inline-block'
  } else {
    // Draw the video frame to the canvas.
    context.drawImage(player, 0, 0, canvas.width, canvas.height);
    canvas.style.display = 'inline-block'
    player.style.display = 'none'
    submitButton.style.display = 'inline-block'
    captureButton.innerHTML = "Take again"
    switchButton.style.display = 'none'
  }
  
});

var stream = null;

switchButton.addEventListener('click', event => {
  player.pause()
  player.srcObject = null

  if (cam == 0) {
    constraints = env_constraints
    cam = 1
  } else {
    constraints = user_constraints
    cam = 0
  }
  // Attach the video stream to the video element and autoplay.
  navigator.mediaDevices.getUserMedia(constraints)
    .then((_stream) => {
      stream = _stream
      player.srcObject = stream;
      player.play();
    });
});

homeButton.addEventListener('click', event => {
  document.getElementById('photo').style.display = 'none'
  document.getElementById('reward').style.display = 'none'
  document.getElementById('stat').style.display = 'none'
  document.getElementById('splash').style.display = 'inline-block'
  homeButton.style.display = 'none'
});

// Attach the video stream to the video element and autoplay.
navigator.mediaDevices.getUserMedia(user_constraints)
  .then((_stream) => {
    stream = _stream
    player.srcObject = stream;
});