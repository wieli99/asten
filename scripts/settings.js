export function registerSettings() {
    // Register module settings
    game.settings.register('asten', 'enableCustomCritRules', {
        name: "Enable Custom Critical Hit Rules",
        hint: "When enabled, critical hits will deal normal damage + maximum possible damage instead of rolling twice.",
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        onChange: value => {
            // Handle setting changes
            console.log(`Asten | Custom critical hit rules ${value ? 'enabled' : 'disabled'}`);
        }
    });

    // Add more settings as needed
}
