/** @type {import("prettier").Config} */
module.exports = {
    semi: true,
    singleQuote: true,
    trailingComma: 'es5', // ou 'all' se preferir
    printWidth: 100,
    tabWidth: 4, // Mude de 2 para 4
    useTabs: false,
    plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-tailwindcss'],
    organizeImportsSkipDestructiveCodeActions: true,
};
