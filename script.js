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
