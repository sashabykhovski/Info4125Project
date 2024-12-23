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

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user);
    loadFavorites(user.uid);
  } else {
    console.log("User not logged in.");
  }
});

// Load favorites from Firestore
function loadFavorites(userId) {
  const favoritesContainer = document.getElementById("favorites-container");
  favoritesContainer.innerHTML = "";

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
        const updatedFavorites = currentFavorites.filter(
          (recipe) => recipe.id !== recipeId
        );
        setDoc(favoritesRef, { recipes: updatedFavorites });
        loadFavorites(user.uid);
      } else {
        const recipe = { id: recipeId, name: `Recipe ${recipeId}` };
        currentFavorites.push(recipe);
        setDoc(favoritesRef, { recipes: currentFavorites });
        loadFavorites(user.uid);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  d3.csv("dataset/recipes.csv")
    .then(function (data) {
      const form = document.getElementById("meal-form");

      if (!form) {
        console.error(
          "Meal form not found. Ensure the form exists with the correct ID."
        );
        return;
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();

        const vegetableInput = document.getElementById("vegetable");
        const proteinInput = document.getElementById("protein");
        const carbInput = document.getElementById("carb");
        const restrictionsInput = document.getElementById(
          "dietary-restrictions"
        );

        if (
          !vegetableInput ||
          !proteinInput ||
          !carbInput ||
          !restrictionsInput
        ) {
          console.error("One or more input elements are missing.");
          return;
        }

        const vegetable = vegetableInput.value.trim().toLowerCase();
        const protein = proteinInput.value.trim().toLowerCase();
        const carb = carbInput.value.trim().toLowerCase();
        const dietaryRestrictions = restrictionsInput.value
          .trim()
          .toLowerCase()
          .split(",")
          .map((restriction) => restriction.trim());

        // Map dietary restrictions to ingredient keywords for filtering
        const dietaryKeywords = {
          dairy: ["milk", "cheese", "butter", "yogurt", "cream"],
          gluten: ["wheat", "barley", "rye", "bread", "pasta"],
          nuts: ["peanut", "almond", "cashew", "walnut", "hazelnut"],
          soy: ["soy", "tofu", "soybean", "edamame"],
          egg: ["egg", "eggs", "eggplant"],
          shellfish: ["shrimp", "lobster", "crab", "oyster", "mussel"],
          vegetarian: ["meat", "beef", "pork", "chicken", "fish"],
        };

        // Aggregate restricted ingredients based on user input
        let restrictedIngredients = [];
        dietaryRestrictions.forEach((restriction) => {
          if (dietaryKeywords[restriction]) {
            restrictedIngredients = restrictedIngredients.concat(
              dietaryKeywords[restriction]
            );
          }
        });

        // Filter recipes based on user inputs
        const filteredRecipes = data.filter((recipe) => {
          const ingredients = recipe.ingredients
            ? recipe.ingredients.toLowerCase()
            : "";

          // Exclude recipes with restricted ingredients
          const hasDietaryConcern = restrictedIngredients.some((ingredient) =>
            ingredients.includes(ingredient)
          );

          return (
            !hasDietaryConcern &&
            (vegetable === "" || ingredients.includes(vegetable)) &&
            (protein === "" || ingredients.includes(protein)) &&
            (carb === "" || ingredients.includes(carb))
          );
        });

        displayRecipes(filteredRecipes);
      });

      function displayRecipes(recipes) {
        const recipesList = document.getElementById("recipes-list");

        if (!recipesList) {
          console.error("Recipes list container not found.");
          return;
        }

        recipesList.innerHTML = "";

        if (recipes.length > 0) {
          recipes.forEach((recipe) => {
            const recipeItem = document.createElement("div");
            recipeItem.className = "recipe-item";
            recipeItem.innerHTML = `
            <h3>${recipe.recipe_name}</h3>
            <p><strong>Prep Time:</strong> ${recipe.prep_time || "N/A"}</p>
            <p><strong>Cook Time:</strong> ${recipe.cook_time || "N/A"}</p>
            <p><strong>Total Time:</strong> ${recipe.total_time || "N/A"}</p>
            <p><strong>Ingredients:</strong> ${recipe.ingredients}</p>
            <p><strong>Directions:</strong> ${recipe.directions}</p>
            <p><a href="${recipe.url}" target="_blank">View Recipe</a></p>
            <img src="${recipe.img_src}" alt="${
              recipe.recipe_name
            }" style="width: 100px;">
            <button class="favorite-btn" aria-label="Add to favorites">❤️</button>
          `;

            const favoriteButton = recipeItem.querySelector(".favorite-btn");
            favoriteButton.addEventListener("click", function () {
              favoriteButton.textContent =
                favoriteButton.textContent === "❤️" ? "💔" : "❤️";

              toggleFavorite(recipe.recipe_name);
            });

            recipesList.appendChild(recipeItem);
          });
        } else {
          const noResults = document.createElement("p");
          noResults.textContent =
            "No recipes found matching your ingredients and dietary concerns.";
          recipesList.appendChild(noResults);
        }
      }
    })
    .catch((error) => {
      console.error("Error loading CSV data:", error);
    });
});
