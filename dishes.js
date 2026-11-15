// Exact mesh/material IDs are shared by GLB, Blender and iPhone variants.
export const DISHES = {
 pizza: {
  title:'Pepperoni Pizza',short:'pizza',number:'02',description:'Golden crust, melted mozzarella and pepperoni. Add a little heat, a few vegetables, or an extra helping of pepperoni.',
  glb:'pizza-layers.glb',usdz:'pizza-customizable-v1.usdz',image:'pizza-menu.png',
  size:'30 cm wide · 4 cm tall',base:'The crust and tomato base always stay.',
  orbit:'25deg 42deg 0.8m',target:'0m 0.02m 0m',separatedOrbit:'25deg 55deg 0.95m',separatedTarget:'0m 0.1m 0m',
  ingredients:[['Pepperoni','Pepperoni',true],['Mozzarella','Mozzarella',true],['Mushrooms','Mushrooms',false],['Olives','Olives',false],['Onions','Onions',false],['Jalapenos','Jalapeños',false],['Extra_Pepperoni','Extra pepperoni',false]],
  fixed:['Crust']
 },
 chicken: {
  title:'Chicken Sandwich',short:'sandwich',number:'03',description:'Crispy golden chicken in a sesame bun, with fresh lettuce, tomato, pickles and mayonnaise. Make it cheesy, smoky or spicy.',
  glb:'chicken-sandwich-layers.glb',usdz:'chicken-sandwich-customizable-v1.usdz',image:'chicken-sandwich-menu.png',
  size:'13 cm wide · 12 cm tall',base:'The top and bottom buns always stay.',
  orbit:'30deg 70deg 0.48m',target:'0m 0.06m 0m',separatedOrbit:'30deg 75deg 0.85m',separatedTarget:'0m 0.16m 0m',
  ingredients:[['Chicken','Chicken',true],['Lettuce','Lettuce',true],['Tomato','Tomato',true],['Pickles','Pickles',true],['Mayonnaise','Mayonnaise',true],['Cheese','Cheese',false],['Bacon','Bacon',false],['Spicy_Sauce','Spicy sauce',false]],
  fixed:['Bottom_Bun','Top_Bun']
 }
};
