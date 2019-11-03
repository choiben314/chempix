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

const numTests = 5
const NUM_SMILES = 100

const loginButton = document.getElementById('login');
const signOutButton = document.getElementById('sign-out');

const menu = document.getElementById('menu');
const rulesButton = document.getElementById('rules');
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
  var userRef = db.collection('Users').doc(uid);
  userRef.get().then(doc => {
    if (doc.exists) {
      loadTakePhoto()
      // if (doc.data().uploads != undefined) {
      //   loadTakePhoto()
      //   if (getRandom() == 1) {
      //   // if ((doc.data().uploads % numTests) == 0) {
      //     loadValidation()
      //   } else {
      //     loadTakePhoto()
      //   }
      // } else {
      //   loadTakePhoto()
      // }
    } else {
      console.log("Error retrieving document: ", error)
    }
  }).catch(error => {
      console.log("Error retrieving document: ", error)
  });
});

const gtMolecule = document.getElementById('gt-molecule')
const vMolecule = document.getElementById('v-molecule')
const moleculesLoading = document.getElementById('loading-molecules')
const goodButton = document.getElementById('good')
const badButton = document.getElementById('bad')

function loadValidation(known) {
  valPageToken(known)
  document.getElementById('splash').style.display = 'none'
  document.getElementById('photo').style.display = 'none'
  document.getElementById('validate').style.display = 'inline-block'
  document.getElementById('home').style.display = 'inline-block'
}

var validationUser = null

var NUM_KNOWN = 10
var KNOWN = false
var KNOWN_CORRECT = false
var upload_index = -1

function valPageToken(known){
  KNOWN = known
  var totalRef = db.collection('Total').doc('Fall-2019');

  if (!KNOWN) {
    totalRef.get().then(doc => {
      upload_index = Math.floor(Math.random() * doc.data().total_uploads).toString()
      db.collection('Uploads').doc(upload_index).get().then(doc => {
        if (doc.exists) {
          valDisplayImage(doc.data().filename)
        } else {
          console.log("Error retrieving document: ", error)
        }
      }).catch(error => {
          valPageToken()
          console.log("Index not found, trying other random index.")
      });
    })
  } else {
    valDisplayImage('null')
  }
}

function valDisplayImage(filename) {
  var gtImageRef, vImageRef

  if (!KNOWN) {
    validationUser = filename.split('__')[0]
    gtImageRef = storageRef.child('gen').child(filename.split('__')[1].split('.')[0] + '.png')
    vImageRef = storageRef.child('up').child(filename)
  } else {
    rand = getRandomInteger(1, 1 + NUM_KNOWN)
    if (rand <= NUM_KNOWN / 2) {
      KNOWN_CORRECT = true
      gtImageRef = storageRef.child('known').child('correct_' + rand.toString() + '_truth.png')
      vImageRef = storageRef.child('known').child('correct_' + rand.toString() + '_drawn.png')
    } else {
      KNOWN_CORRECT = false
      gtImageRef = storageRef.child('known').child('incorrect_' + (rand - (NUM_KNOWN / 2)).toString() + '_truth.png')
      vImageRef = storageRef.child('known').child('incorrect_' + (rand - (NUM_KNOWN / 2)).toString() + '_drawn.png')
    }
  }

  gtImageRef.getDownloadURL().then(gtUrl => {
    vImageRef.getDownloadURL().then(vUrl => {
      gtMolecule.src = gtUrl
      gtMolecule.style.display = 'inline-block'
      vMolecule.src = vUrl
      vMolecule.style.display = 'inline-block'
      moleculesLoading.style.display = 'none'
      goodButton.style.display = 'inline-block'
      badButton.style.display = 'inline-block'
      homeButton.style.display = 'inline-block'
    })
  });
}

goodButton.addEventListener('click', event => {
  if (!KNOWN) {
    db.collection('Uploads').doc(upload_index).update({good: firebase.firestore.FieldValue.increment(1)})
    var email = validationUser + "@stanford.edu"
    db.collection('Users').where("email", "==", email).get().then(querySnapshot => {
      querySnapshot.forEach(doc => {
        db.collection('Users').doc(doc.id).update({good: firebase.firestore.FieldValue.increment(1)}).then(() => {
          feedbackReceived()
        })
      });
    });
  } else {
    if (KNOWN_CORRECT) {
      db.collection('Users').doc(uid).update({known_true: firebase.firestore.FieldValue.increment(1)}).then(() => {
          feedbackReceived()
        })
    } else {
      db.collection('Users').doc(uid).update({known_false: firebase.firestore.FieldValue.increment(1)}).then(() => {
          feedbackReceived()
        })
    }
  }
});

badButton.addEventListener('click', event => {
  if (!KNOWN) {
    db.collection('Uploads').doc(upload_index).update({bad: firebase.firestore.FieldValue.increment(1)})
    var email = validationUser + "@stanford.edu"
    db.collection('Users').where("email", "==", email).get().then(querySnapshot => {
      querySnapshot.forEach(doc => {
        db.collection('Users').doc(doc.id).update({bad: firebase.firestore.FieldValue.increment(1)}).then(() => {
          feedbackReceived();
        });
      });
    });
  } else {
    if (KNOWN_CORRECT) {
      db.collection('Users').doc(uid).update({known_false: firebase.firestore.FieldValue.increment(1)}).then(() => {
          feedbackReceived()
        })
    } else {
      db.collection('Users').doc(uid).update({known_true: firebase.firestore.FieldValue.increment(1)}).then(() => {
          feedbackReceived()
        })
    }
  }
});

function feedbackReceived() {
  loadTakePhoto()
  gtMolecule.style.display = 'none'
  vMolecule.style.display = 'none'
  moleculesLoading.style.display = 'inline-block'
  goodButton.style.display = 'none'
  badButton.style.display = 'none'
  homeButton.style.display = 'none'
}

function loadTakePhoto() {
  pageToken()
  document.getElementById('splash').style.display = 'none'
  document.getElementById('validate').style.display = 'none'
  document.getElementById('photo').style.display = 'inline-block'
  document.getElementById('home').style.display = 'inline-block'
  submitButton.style.display = 'none'
  captureButton.innerHTML = "Take Photo"
  imgPreview.style.display = 'none'
  rotateButton.style.display = 'none'
  captureButton.style.display = 'none'
  moleculeLoading.style.display = 'inline-block'
  moleculeLoading.innerHTML = 'Loading molecule...'
  molecule.style.display = 'none'
  homeButton.style.display = 'none'
}

rulesButton.addEventListener('click', event => {
  document.getElementById('splash').style.display = 'none'
  document.getElementById('rule').style.display = 'inline-block'
  document.getElementById('home').style.display = 'inline-block'
});

rewardsButton.addEventListener('click', event => {
  document.getElementById('splash').style.display = 'none'
  document.getElementById('reward').style.display = 'inline-block'
  document.getElementById('home').style.display = 'inline-block'
  updateRewards()
});

statsButton.addEventListener('click', event => {
  document.getElementById('splash').style.display = 'none'
  document.getElementById('stat').style.display = 'inline-block'
  document.getElementById('home').style.display = 'inline-block'
  updateStats()
});

var uid = null

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    if (user.email.endsWith("stanford.edu")) {
      db.collection('Users').doc(user.uid).get().then(doc => {
        uid = user.uid
        username = user.email.substr(0, user.email.indexOf('@'))
        signOutButton.style.display = 'inline-block';
        loginButton.style.display = 'none';
        menu.style.display = 'inline-block';
        document.getElementById('loading').style.display = 'none'
        if (doc.exists && doc.data().uploads != undefined) {
          // Uploads have already been submitted
        } else {
          document.getElementById('splash').style.display = 'none'
          document.getElementById('rule').style.display = 'inline-block'
          document.getElementById('home').style.display = 'inline-block'
        }
      });
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
const moleculeLoading = document.getElementById('loading-molecule')
const inputFile = document.getElementById('input');
const imgPreview = document.getElementById('preview')
const rotateButton = document.getElementById('rotate');
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

var db = firebase.firestore()
var storageRef = firebase.storage().ref()
var file = null
var imageRef = null
var origWidth = null
var origHeight = null

inputFile.onchange = function() {
  if (inputFile.files.length == 0) {
    submitButton.style.display = 'none'
    captureButton.innerHTML = "Take Photo"
    imgPreview.style.display = 'none'
    rotateButton.style.display = 'none'
  } else {
    submitButton.style.display = 'inline-block'
    captureButton.innerHTML = "Take Again"
    imgPreview.style.display = 'inline-block'
    rotateButton.style.display = 'inline-block'
  }
  previewFile()
};

var ROTATION_STATE = 0;
rotateButton.addEventListener('click', event => {
  ROTATION_STATE = (ROTATION_STATE + 1) % 4;
  imgPreview.style.transform = 'rotate(' + ROTATION_STATE * 90 + 'deg)';
});

function previewFile() {
  var rawFile = inputFile.files[0];
  var reader  = new FileReader();

  reader.addEventListener("load", function () {
    imgPreview.src = reader.result;
    var img = new Image();
    img.onload = function() {
      origWidth = this.width
      origHeight = this.height

      if (origWidth > origHeight) {
        ImageTools.resize(rawFile, {
            width: 480 * origWidth / origHeight, // maximum width
            height: 480 // maximum height
        }, function(blob, didItResize) {
            file = blob
        });
      } else {
        ImageTools.resize(rawFile, {
            width: 480, // maximum width
            height: 480 * origHeight / origWidth // maximum height
        }, function(blob, didItResize) {
            file = blob
        });
      }
    }
    img.src = reader.result;
  }, false);

  if (rawFile) {
    reader.readAsDataURL(rawFile);
  }
}

var smile_index;
function pageToken(){
  var totalRef = db.collection('Total').doc('Fall-2019');
  totalRef.get().then(docTotal => {
    smile_index = docTotal.data().total_seen.toString()
    // var smile_index = Math.floor(Math.random() * NUM_SMILES).toString()
    db.collection('Smiles').doc(smile_index).get().then(doc => {
      if (doc.exists) {
        displayImage(doc.data().smile)
      } else {
        console.log("Error retrieving document: ", error)
      }
    }).catch(error => {
        console.log("Error retrieving document: ", error)
    });
  });
}

function displayImage(smile) {
  imageRef = storageRef.child('gen').child(smile + '.png')
  imageRef.getDownloadURL().then(url => {
    var totalRef = db.collection('Total').doc('Fall-2019');
    totalRef.update({total_seen: firebase.firestore.FieldValue.increment(1)});
    molecule.src = url
    molecule.style.display = 'inline-block'
    moleculeLoading.style.display = 'none'
    captureButton.innerHTML = "Take Photo"
    captureButton.style.display = 'inline-block'
    homeButton.style.display = 'inline-block'
  });
}

submitButton.addEventListener('click', event => {
  var metadata = {
    customMetadata: {
      'smile': imageRef.name.split('.')[0],
      'rotation_state': ROTATION_STATE
    }
  }
  db.collection("Smiles").doc(smile_index).delete();
  var filename = username + '__' + imageRef.name.split('.')[0] + '.' + file.type.split('/')[1]
  const uploadTask = storageRef.child('up/' + filename).put(file, metadata); //create a child directory called images, and place the file inside this directory
  uploadTask.on('state_changed', (snapshot) => {
    submitButton.style.display = 'none'
    captureButton.style.display = 'none'
    moleculeLoading.style.display = 'inline-block'
    moleculeLoading.innerHTML = 'Uploading...'
    molecule.style.display = 'none'
    imgPreview.style.display = 'none'
    rotateButton.style.display = 'none'
    homeButton.style.display = 'none'
  // Observe state change events such as progress, pause, and resume
  }, (error) => {
    // Handle unsuccessful uploads
    console.log(error);
  }, () => {
    var userRef = db.collection('Users').doc(uid);
    userRef.get().then(doc => {
      if (doc.exists) {
        userRef.update({uploads: firebase.firestore.FieldValue.increment(1)});
        var totalRef = db.collection('Total').doc('Fall-2019');
        totalRef.update({total_uploads: firebase.firestore.FieldValue.increment(1)}).then(function() {
          totalRef.get().then(doc => {
            db.collection('Uploads').doc((doc.data().total_uploads - 1).toString()).set({'filename': filename, 'rotation_state': ROTATION_STATE})
            }).catch(error => {
                console.log("Error retrieving document: ", error)
            });
        }).then(() => {
          userRef.get().then(doc => {
          if (doc.data().uploads != undefined) {
            if (getRandom() == 1) {
            // if ((doc.data().uploads % numTests) == 0) {
              loadValidation(false)
            } else if (getRandom() == 2) {
              moleculeLoading.innerHTML = 'Loading molecule...'
              captureButton.innerHTML = "Take Photo"
              pageToken()
            } else {
              loadValidation(true)
            }
          } else {
            moleculeLoading.innerHTML = 'Loading molecule...'
            captureButton.innerHTML = "Take Photo"
            pageToken()
          }
        });
        })
      } else {
        console.log("Error retrieving document: ", error)
      }
    }).catch(error => {
        console.log("Error retrieving document: ", error)
    })
  });
});

function getRandom(){
  var num=Math.random();
  if(num < 0.2) return 1;  //probability 0.2
  else if(num < 0.9) return 2; // probability 0.7
  else return 3;  //probability 0.1
}

function getRandomInteger(min, max){
  return Math.floor(Math.random() * (+max - +min)) + +min;
}

const entries = document.getElementById('entries')
const imagesLeft = document.getElementById('images-left')
const imagesLeftBonus = document.getElementById('images-left-bonus')

function updateRewards() {
  db.collection('Users').doc(uid).get().then(doc => {
    if (doc.exists) {
      if (doc.data().uploads != undefined) {
        entries.innerHTML = "# of raffle tickets: " + Math.floor(doc.data().uploads / 5)
        imagesLeft.innerHTML = "Progress towards next raffle ticket: " + (doc.data().uploads % 5) + "/5"
        imagesLeftBonus.innerHTML = "Progress towards next bonus raffle ticket: " + (doc.data().uploads % 25) + "/25"
      } else {
        entries.innerHTML = "# of raffle tickets: 0"
        imagesLeft.innerHTML = "Progress towards next raffle ticket: 0/5"
        imagesLeftBonus.innerHTML = "Progress towards next bonus raffle ticket: 0/25"
      }
    } else {
      console.log("Error retrieving document: ", error)
    }
  }).catch(error => {
      console.log("Error retrieving document: ", error)
  });
}

const totals = document.getElementById('totals')
const totalImagesLeft = document.getElementById('total-images-left')
const countdown = document.getElementById('countdown')

const THRESHOLDS = [1000, 5000, 10000, 20000, 50000, 100000]

var list = document.getElementById('progress'),
    children = list.children,
    completed = 0;

function getCompleted(total) {
  for (var i = 0; i < THRESHOLDS.length; i++) {
    if (total < THRESHOLDS[i]) {
      return 2 * i - 1
    }
  }
  return 2 * THRESHOLDS.length - 1
}

function timeText(countDownDate) {
  var now = new Date().getTime();
    
  var distance = countDownDate - now;
    
  var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  // var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
  countdown.innerHTML = days + " days, " + hours + " hours, and "
  + minutes + " minutes remaining.";
    
  if (distance < 0) {
    clearInterval(x);
    countdown.innerHTML = "Submission period has ended! Raffle winners will be announced shortly.";
  }
}

function updateStats() {
  var countDownDate = new Date("Dec 13, 2019 17:00:00").getTime();
  timeText(countDownDate)
  var x = setInterval(timeText(countDownDate), 60000);

  db.collection('Total').doc('Fall-2019').get().then(doc => {
    if (doc.exists) {
      var total = 0
      if (doc.data().total_uploads != undefined) {
        total = doc.data().total_uploads
        totals.innerHTML = total + " images collected by app users!"
        // imagesLeft.innerHTML = "# images before next entry: " + (25 - (doc.data().uploads % 25))
      } else {
        totals.innerHTML = "0 images collected by app users."
      }
      completed = getCompleted(total)

      if (completed > children.length) return;
      
      if (completed == children.length) {
        totalImagesLeft.innerHTML = "All prizes unlocked."
      } else {
        if (THRESHOLDS[(completed + 1) / 2] - total == 1) {
          totalImagesLeft.innerHTML = THRESHOLDS[(completed + 1) / 2] - total + " image to unlock next raffle prize."
        } else {
          totalImagesLeft.innerHTML = THRESHOLDS[(completed + 1) / 2] - total + " images to unlock next raffle prize."
        }
      }

      for (var i = children.length - 1; i > children.length - 1 - completed; i--) {
          children[i].children[0].classList.remove('grey');
          children[i].children[0].classList.add('green');
          
          if (i % 2 === 0) {
              children[i].children[0].classList.add('activated');            
          }
      }
    } else {
      console.log("Error retrieving document: ", error)
    }
  }).catch(error => {
      console.log("Error retrieving document: ", error)
  });
}

homeButton.addEventListener('click', event => {
  document.getElementById('photo').style.display = 'none'
  document.getElementById('validate').style.display = 'none'
  document.getElementById('rule').style.display = 'none'
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