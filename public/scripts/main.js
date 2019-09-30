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

var username = null

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
  pageToken()
  document.getElementById('splash').style.display = 'none'
  document.getElementById('photo').style.display = 'inline-block'
  document.getElementById('home').style.display = 'inline-block'
});

rewardsButton.addEventListener('click', event => {
  console.log('hello')
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
      username = user.email.substr(0, user.email.indexOf('@'))
      signOutButton.style.display = 'inline-block';
      loginButton.style.display = 'none';
      menu.style.display = 'inline-block';
      document.getElementById('loading').style.display = 'none'

    } else {
      alert("Error: Must use stanford.edu email.");
      // firebase.auth().signOut();
      firebase.auth().currentUser.delete();
    }
  } else {
    // No user is signed in.
    signOutButton.style.display = 'none';
    loginButton.style.display = 'inline-block';
    menu.style.display = 'none';
    document.getElementById('loading').style.display = 'none'
  }
});

const container = document.getElementById('container');
const player = document.getElementById('player');
const canvas = document.getElementById('canvas');
const molecule = document.getElementById('molecule');
const inputFile = document.getElementById('input');
const imgPreview = document.getElementById('preview')
const captureButton = document.getElementById('capture');
const submitButton = document.getElementById('submit');
const homeButton = document.getElementById('home');

// container.width = window.innerWidth * 0.85;
// player.width = window.innerWidth * 0.85;
// player.height = window.innerHeight * 0.6;

imgPreview.width = window.innerWidth * 0.75;
imgPreview.height = imgPreview.width;

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

// player.addEventListener( "loadedmetadata", function (e) {
//     // Ratio of the video's intrinsic dimensions
//     var videoRatio = this.videoWidth / this.videoHeight;
//     // console.log(this.videoWidth);
//     // console.log(this.videoHeight);
//     // The width and height of the video element
//     var width = this.offsetWidth, height = this.offsetHeight;
//     // The ratio of the element's width to its height
//     var elementRatio = width / height;
//     // If the video element is short and wide
//     if(elementRatio > videoRatio) width = height * videoRatio;
//     // It must be tall and thin, or exactly equal to the original ratio
//     else height = width / videoRatio;
//     // canvas.width = width;
//     // canvas.height = height;
//     // console.log(canvas.width);
//     // console.log(canvas.height);
// }, false );

var storageRef = firebase.storage().ref()
var file = null

inputFile.onchange = function() {
  if (inputFile.files.length == 0) {
    submitButton.style.display = 'none'
    captureButton.innerHTML = "Capture"
    imgPreview.style.display = 'none'
  } else {
    submitButton.style.display = 'inline-block'
    captureButton.innerHTML = "Take Again"
    imgPreview.style.display = 'inline-block'
  }
  previewFile()
};

function previewFile() {
  //var preview = document.getElementById('preview')
  file    = inputFile.files[0];
  var reader  = new FileReader();

  reader.addEventListener("load", function () {
    imgPreview.src = reader.result;
  }, false);

  if (file) {
    reader.readAsDataURL(file);
  }
}
async function pageToken(){
  // Create a reference under which you want to list
  var listRef = storageRef.child('gen');
  // Fetch the first page of 100.
  var firstItem = await listRef.list({ maxResults: 100}).then(result => {
    displayImage(result.items[Math.floor(Math.random() * Math.min(100, result.items.length))])    
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function security_break(del) {
  await sleep(20000);
  storageRef.child('gen/' + del).delete().then(function() {
    console.log("deleted")
  })
}

function displayImage(imageRef) {
  imageRef.getDownloadURL().then(url => {
    molecule.src = url
    security_break(imageRef.name)
  });
  submitButton.addEventListener('click', event => {
    var metadata = {
      customMetadata: {
        'smile': imageRef.name.split('.')[0]
      }
    }
    const uploadTask = storageRef.child('up/' + username + '__' + imageRef.name.split('.')[0]).put(file, metadata); //create a child directory called images, and place the file inside this directory
    uploadTask.on('state_changed', (snapshot) => {
    // Observe state change events such as progress, pause, and resume
    }, (error) => {
      // Handle unsuccessful uploads
      console.log(error);
    }, () => {
      submitButton.style.display = 'none'
      captureButton.innerHTML = "Capture"
      imgPreview.style.display = 'none'
      pageToken()
    });
  });
}

homeButton.addEventListener('click', event => {
  document.getElementById('photo').style.display = 'none'
  document.getElementById('reward').style.display = 'none'
  document.getElementById('stat').style.display = 'none'
  document.getElementById('splash').style.display = 'inline-block'
  homeButton.style.display = 'none'
});

// // Attach the video stream to the video element and autoplay.
// navigator.mediaDevices.getUserMedia(user_constraints)
//   .then((_stream) => {
//     stream = _stream
//     player.srcObject = stream;
// });