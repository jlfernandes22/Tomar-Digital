declare module "*.png" {
  const value: any;
  export default value;
}

declare module "*.jpg" {
  const value: any;
  export default value;
}

declare module "*.jpeg" {
  const value: any;
  export default value;
}

declare module "*.webp" {
  const value: any;
  export default value;
}

// Removed broken react-native-paper module declaration because it conflicts with the package's own type declarations.
// If you need custom theme color slots, extend the theme in your own app types instead of re-declaring the module.
