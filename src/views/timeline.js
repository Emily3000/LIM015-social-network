// import firebase from '../firebase/firebase.js';
import { logOutUser, firebaseWatcher } from '../firebase/firebase-auth.js';
import {
  addPostCollection, getPosts, onGetPosts,
  deletePost, updatePost, updateLoves, getPostsUserId
} from '../firebase/firebase-firestore.js';

// Constante a exportar
export const TIMELINE = () => {
  const view = `
  <section class='timeLineContainer'>
    <section class='profileContainer'>
      <figure>
        <img id='imgUser' class='imgProfile' src="../images/imgDefault3.png" alt="photoProfile" />
      </figure>
      <p id='nameProfile' class='nameProfile'></p>
      <p id='status' class='status'>Estado: Viajer@ Empedernid@</p>
    </section>
    <section class='publicationContainer'>
    <section class='publication'>
      <textarea name='publication' id='textAreaPublication' class='textAreaPublication' placeholder='¿Qué deseas compartir con la comunidad de viajeros?' rows='3'></textarea>
      <div class='buttonsPost'>
        <button id='buttonImg' type='button' class='buttonImg'>&#127889;</button>
        <button id='buttonShare' type='submit' class='buttonShare'>Compartir</button>
      </div>
      </section>
    <section id='posts' class='postSection'>
    </section>
    </section>
  </section>
  `;
  const divElement = document.createElement('div');
  divElement.className = 'divContent';
  divElement.innerHTML = view;
  // Constantes Globales
  const btnShare = divElement.querySelector('#buttonShare');
  const btnImg = divElement.querySelector('#buttonImg');
  const linkAboutLogOut = document.querySelector('.logOut a');
  const textPost = divElement.querySelector('#textAreaPublication');
  const userNameProfile = divElement.querySelector('#nameProfile');
  const postContent = divElement.querySelector('#posts');
  const imgElement = divElement.querySelector('#imgUser');
  // FUNCIONALIDAD
  firebaseWatcher();
  // ------------------------- Foto de perfil -------------------------
  if (localStorage.getItem('userPhoto')) {
    imgElement.src = localStorage.getItem('userPhoto');
  } else {
    imgElement.src = '../images/imgDefault3.png';
  }
  // -------------------------  Mostrar nombre de perfil -------------------------
  if (localStorage.getItem('userName') === null) {
    userNameProfile.textContent = localStorage.getItem('userEmail');
  } else {
    userNameProfile.textContent = localStorage.getItem('userName');
  }
  // ------------------------- Boton compartir -------------------------
  btnShare.addEventListener('click', () => {
    if (textPost.value === '') {
      console.log('publicacion vacia');
    } else {
      // aqui va lo de firestore
      addPostCollection(localStorage.getItem('userName'), localStorage.getItem('userEmail'), textPost.value, localStorage.getItem('userId'))
        .then((promise) => {
          const idCollection = promise.id;
          const pathCollection = promise.path;
          console.log(idCollection, pathCollection);
          textPost.value = '';
        });
    }
  });
  // ------------------------- Ejecutarse cuando se actualice la pagina -------------------------
  onGetPosts(() => {
    postContent.innerHTML = '';
    // SNAPSHOT
    getPosts().then((docRef) => {
      docRef.forEach((docAboutCollection) => {
        const idPost = docAboutCollection.ref.id;
        const existPost = docAboutCollection.exists;
        const pathPost = docAboutCollection.ref.path;
        const postInfo = docAboutCollection.data();
        // console.log(docAboutCollection);
        // console.log(idPost, existPost, pathPost);
        // console.log(docAboutCollection);
        // console.log(postInfo);
        // console.log(postInfo.post);
        postContent.innerHTML += `<section class='postMessage'>
          <div class='authorPost' name='${postInfo.id}'>
            <p>Publicado por <span id='userNamePost' class='userNamePost' >${postInfo.mail}</span></p>
            <button id='${idPost}' class='btnDelete'>&#10062;</button>
          </div>
          <div class='sectionAboutPost'>
            <input name='${idPost}' disabled class='postContent' value='${postInfo.post}'>
            <div>
              <button id='${idPost}' class='btnEdit'>&#9997;</button>
              <button id='${idPost}' class='btnSave'>&#9989;</button>
          </div>
          </div>
          <div id='reactionPost' class='reactionPost'>
            <button id='${idPost}' class='btnLove'>&#x2764;&#xfe0f;</button>
            <span name='${idPost}'>${postInfo.likes.length}</span>
            <button id='${idPost}' class='btnDkislike'>&#128078;</button>
            <button id='${idPost}' class='btnComments'>&#128172;</button>
            <span>0</span>
          </div>
        </section>`;
      });
    })
      .catch((error) => {
        console.log(error);
      });
    // ------------------------- Boton love -------------------------
    divElement.addEventListener('click', async (e) => {
      if (e.target.className === 'btnLove') {
        getPostsUserId(e.target.id)
          .then((postInfo) => {
            const userId = localStorage.getItem('userId');
            const userLikes = postInfo.data().likes;
            const newLike = {
              userEmail: localStorage.getItem('userEmail'),
              userID: userId,
            };
            userLikes.push(newLike);
            updateLoves(e.target.id, userLikes);
            // console.log(userLikes);
            // console.log(e.target);
            // console.log(e.target.id);
            // console.log(userId);
            // console.log(userLikes.includes(userID));
            // userLikes.filter((arr) => console.log(arr.userID));
          });
      }
    });
    // ------------------------- Boton dislike -------------------------
    divElement.addEventListener('click', async (e) => {
      if (e.target.className === 'btnDkislike') {
        getPostsUserId(e.target.id)
          .then((postInfo) => {
            if (postInfo.data().id === localStorage.getItem('userId')) {
              console.log('BIEN, ERES LA MISMA PERSONA');
              updateLoves(e.target.id, 0);
            } else {
              console.log('RAYOS! NO ERES EL MISMO USUARIO :C');
              updateLoves(e.target.id, 0);
            }
          });
      }
    });
    // ------------------------- Boton Edit -------------------------
    divElement.addEventListener('click', async (e) => {
      if (e.target.className === 'btnEdit') {
        getPostsUserId(e.target.id)
          .then((postInfo) => {
            if (postInfo.data().id === localStorage.getItem('userId')) {
              console.log('BIEN, ERES LA MISMA PERSONA');
              document.querySelector(`input[name='${e.target.id}']`).disabled = false;
            } else {
              console.log('RAYOS! NO ERES EL MISMO USUARIO :C');
              document.querySelector(`input[name='${e.target.id}']`).disabled = true;
            }
          });
      }
    });
    // ------------------------- Boton Save  -------------------------
    divElement.addEventListener('click', async (e) => {
      if (e.target.className === 'btnSave') {
        const postSave = document.querySelector(`input[name='${e.target.id}']`);
        getPostsUserId(e.target.id)
          .then((postInfo) => {
            if (postInfo.data().id === localStorage.getItem('userId')) {
              console.log('BIEN, ERES LA MISMA PERSONA');
              updatePost(e.target.id, postSave.value);
            } else {
              console.log('RAYOS! NO ERES EL MISMO USUARIO :C');
              document.querySelector(`input[name='${e.target.id}']`).disabled = true;
            }
          });
      }
    });
  });
  // ------------------------- Boton Delete -------------------------
  divElement.addEventListener('click', async (e) => {
    if (e.target.className === 'btnDelete') {
      getPostsUserId(e.target.id)
        .then((postInfo) => {
          if (postInfo.data().id === localStorage.getItem('userId')) {
            console.log('BIEN, ERES LA MISMA PERSONA');
            deletePost(e.target.id);
          } else {
            console.log('RAYOS! NO ERES EL MISMO USUARIO :C');
          }
        });
    }
  });
  // ------------------------- Ancla salir -------------------------
  linkAboutLogOut.addEventListener('click', (e) => {
    e.preventDefault();
    logOutUser().then(() => {
      console.log('cierre de sesion exitoso');
      window.location.hash = '#/';
      localStorage.clear();
    });
  });
  return divElement;
};
