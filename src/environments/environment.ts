// Development environment.
// IMPORTANT: Replace placeholders below with your real Firebase web app config.
// You can find these values at:
//   Firebase Console -> Project Settings -> General -> Your apps -> Web app -> SDK setup

export const environment = {
  production: false,

  // === Firebase Web App Config ===
  firebase: {
    apiKey: 'AIzaSyDTzVbsCBEWRJ_sbgSmgD58t6g4sqm8xmk',
    authDomain: 'creativecollection18.firebaseapp.com',
    projectId: 'creativecollection18',
    storageBucket: 'creativecollection18.firebasestorage.app',
    messagingSenderId: '949406008591',
    appId: '1:949406008591:web:2cad0f121a0821c68aaa7a',
    measurementId: 'G-DYSBPT5WSP'
  },

  // === Brand / Business config ===
  brand: {
    name: 'Creative Collection_18',
    creator: 'By Sayali Kedar',
    email: 'creativecollection18@gmail.com',
    instagram: 'https://www.instagram.com/creative_collection_1_8?igsh=NTJmeTYyc2V6NGZu',
    instagramHandle: 'creative_collection_1_8',
    instagramOwner: 'SAYALI',
    instagramBio: 'Digital creator · Art · Ideas · Recipes · Magic\nCreating, inspiring & sharing\nWhere creativity flows and imagination shines.\nSangola',
    instagramStats: { posts: 146, followers: 478, following: 5 },
    address: 'Sangola,Maharashtra,India'
  },

  // === Payment ===
  payment: {
    upiId: '9176665****@upi',
    upiName: 'Creative Collection',
    qrImagePath: 'assets/payment-qr.png'
  }
};
