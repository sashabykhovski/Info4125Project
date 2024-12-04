// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC668JiRpUoysN-OjMk6bd2GN5jh8zswBs",
  authDomain: "info4125-final.firebaseapp.com",
  projectId: "info4125-final",
  storageBucket: "info4125-final.firebasestorage.app",
  messagingSenderId: "318207991807",
  appId: "1:318207991807:web:a93c73386323ee715b91ca",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Handle authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user);
    loadFavorites(user.uid); // Load user-specific favorites from Firestore
  } else {
    console.log("User not logged in.");
  }
});

// Load favorites from Firestore
function loadFavorites(userId) {
  const favoritesContainer = document.getElementById("favorites-container");
  favoritesContainer.innerHTML = ""; // Clear favorites list

  const favoritesRef = doc(db, "favorites", userId);
  getDoc(favoritesRef).then((docSnap) => {
    if (docSnap.exists()) {
      const favorites = docSnap.data().recipes || [];
      favorites.forEach((recipe) => {
        addFavoriteToList(recipe);
      });
    }
  });
}

// Add recipe to the favorites list
function addFavoriteToList(recipe) {
  const favoritesContainer = document.getElementById("favorites-container");
  const favoriteDiv = document.createElement("div");
  favoriteDiv.className = "favorite-item";
  favoriteDiv.innerHTML = `
      <p>${recipe.name}</p>
      <button class="remove-favorite" data-id="${recipe.id}">Remove</button>
  `;
  favoritesContainer.appendChild(favoriteDiv);

  // Add remove functionality
  favoriteDiv
    .querySelector(".remove-favorite")
    .addEventListener("click", () => {
      toggleFavorite(recipe.id);
    });
}

// Toggle favorite status (like/unlike)
function toggleFavorite(recipeId) {
  const user = auth.currentUser;
  if (user) {
    const favoritesRef = doc(db, "favorites", user.uid);

    getDoc(favoritesRef).then((docSnap) => {
      const currentFavorites = docSnap.exists() ? docSnap.data().recipes : [];

      if (currentFavorites.some((recipe) => recipe.id === recipeId)) {
        // Remove recipe from favorites
        const updatedFavorites = currentFavorites.filter(
          (recipe) => recipe.id !== recipeId
        );
        setDoc(favoritesRef, { recipes: updatedFavorites });
        loadFavorites(user.uid); // Reload favorites
      } else {
        // Add recipe to favorites
        const recipe = { id: recipeId, name: `Recipe ${recipeId}` }; // Replace with actual data
        currentFavorites.push(recipe);
        setDoc(favoritesRef, { recipes: currentFavorites });
        loadFavorites(user.uid); // Reload favorites
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  d3.csv("dataset/recipes.csv").then(function (data) {
    const form = document.getElementById("meal-form");
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const vegetable = document
        .getElementById("vegetable")
        .value.toLowerCase();
      const protein = document.getElementById("protein").value.toLowerCase();
      const carb = document.getElementById("carb").value.toLowerCase();
      const dietaryRestrictions = document
        .getElementById("dietary-restrictions")
        .value.toLowerCase()
        .split(",")
        .map((restriction) => restriction.trim());

      // Convert dietary restrictions into ingredient keywords for filtering
      const dietaryKeywords = {
        dairy: ["milk", "cheese", "butter", "yogurt", "cream"],
        gluten: ["wheat", "barley", "rye", "bread", "pasta"],
        nuts: ["peanut", "almond", "cashew", "walnut", "hazelnut"],
        soy: ["soy", "tofu", "soybean", "edamame"],
        egg: ["egg", "eggs", "eggplant"],
        shellfish: ["shrimp", "lobster", "crab", "oyster", "mussel"],
        vegetarian: ["meat", "beef", "pork", "chicken", "fish"],
      };

      // Flatten dietary restrictions into a list of ingredients to filter
      let restrictedIngredients = [];
      dietaryRestrictions.forEach(function (restriction) {
        if (dietaryKeywords[restriction]) {
          restrictedIngredients = [
            ...restrictedIngredients,
            ...dietaryKeywords[restriction],
          ];
        }
      });

      // Filter recipes based on the ingredients and dietary concerns
      const filteredRecipes = data.filter(function (recipe) {
        const ingredients = recipe.ingredients.toLowerCase();

        // Check if any restricted ingredient is in the recipe
        const hasDietaryConcern = restrictedIngredients.some((ingredient) =>
          ingredients.includes(ingredient)
        );

        return (
          !hasDietaryConcern && // Exclude recipes with restricted ingredients
          (vegetable === "" || ingredients.includes(vegetable)) &&
          (protein === "" || ingredients.includes(protein)) &&
          (carb === "" || ingredients.includes(carb))
        );
      });

      displayRecipes(filteredRecipes);
    });

    function displayRecipes(recipes) {
      const recipesList = d3.select("#recipes-list");
      recipesList.html("");

      if (recipes.length > 0) {
        recipes.forEach(function (recipe) {
          recipesList.append("div").attr("class", "recipe-item").html(`
                            <h3>${recipe.recipe_name}</h3>
                            <p><strong>Prep Time:</strong> ${
                              recipe.prep_time || "N/A"
                            }</p>
                            <p><strong>Cook Time:</strong> ${
                              recipe.cook_time || "N/A"
                            }</p>
                            <p><strong>Total Time:</strong> ${
                              recipe.total_time || "N/A"
                            }</p>
                            <p><strong>Ingredients:</strong> ${
                              recipe.ingredients
                            }</p>
                            <p><strong>Directions:</strong> ${
                              recipe.directions
                            }</p>
                            <p><a href="${
                              recipe.url
                            }" target="_blank">View Recipe</a></p>
                            <img src="${
                              recipe.img_src
                            }" alt="${recipe.recipe_name}" style="width: 100px;">
                        `);
        });
      } else {
        recipesList
          .append("p")
          .text(
            "No recipes found matching your ingredients and dietary concerns."
          );
      }
    }
  });
});
