// Import settings
import { registerSettings } from './settings.js';

// Main module class
class AstenRules {
    static MODULE_ID = 'asten';

    static init() {
        console.log('Asten | Initializing Asten Homebrew Rules');

        // Register module settings
        registerSettings();

        // Register hooks
        this._registerHooks();
    }

    static _registerHooks() {
        // Hook into the critical hit damage calculation
        Hooks.on('dnd5e.rollDamage', this._onRollDamage.bind(this));

        // Add a visual indicator for critical hits
        Hooks.on('renderChatMessage', this._onRenderChatMessage.bind(this));
    }

    static _onRollDamage(item, rollConfig) {
        // Only apply if the custom crit rule is enabled
        if (!game.settings.get('asten', 'enableCustomCritRules')) return;

        // Only modify critical hits
        if (!rollConfig.critical) return;

        // Store the original critical behavior
        const originalCritBehavior = rollConfig.criticalBehavior;

        // Override the critical behavior
        rollConfig.criticalBehavior = "astenCrit";

        // Store the original damage formula
        const originalFormula = rollConfig.parts[0];

        // Create our custom critical hit handler
        const criticalHandler = async (formula, rollData) => {
            // Get the dice from the formula
            const rollFormula = formula;

            // Create a new roll with the normal formula (single roll)
            const normalRoll = await new Roll(rollFormula, rollData).evaluate({async: true});

            // Create a roll to calculate the maximum possible value
            // We'll replace each die with its maximum value
            let maxFormula = rollFormula.replace(/(\d+)d(\d+)/g, (match, count, faces) => {
                return `${count} * ${faces}`;
            });

            const maxRoll = await new Roll(maxFormula, rollData).evaluate({async: true});

            // Combine the results
            const totalDamage = normalRoll.total + maxRoll.total;

            // Create a custom roll result that shows both components
            const customRoll = new Roll(`${normalRoll.result} + ${maxRoll.result}`, rollData);
            customRoll.terms = [...normalRoll.terms, {operator: "+"}, ...maxRoll.terms];
            customRoll._total = totalDamage;
            customRoll._evaluated = true;

            // Add flavor text to explain the calculation
            customRoll.options.flavor = "Asten Critical Hit: Normal Roll + Maximum Damage";

            return customRoll;
        };

        // Register our custom critical behavior
        CONFIG.Dice.DamageRoll.criticalBehaviors.astenCrit = criticalHandler;
    }

    static _onRenderChatMessage(message, html, data) {
        // Only proceed if custom crit rules are enabled
        if (!game.settings.get('asten', 'enableCustomCritRules')) return;

        // Check if this is a damage roll message with our custom crit
        const rollData = message.rolls?.[0];
        if (rollData?.options?.flavor?.includes("Asten Critical Hit")) {
            // Add a visual indicator for our custom crit
            const header = html.find('.message-header');
            header.addClass('asten-crit-message');

            // Add an explanation of the rule
            const content = html.find('.message-content');
            content.prepend(`
        <div class="asten-crit-explanation">
          <p>Using Asten critical hit rules: normal roll + maximum damage</p>
        </div>
      `);
        }
    }
}

// Initialize the module
Hooks.once('init', () => {
    AstenRules.init();
});

// Hook that triggers after game data is loaded
Hooks.once('ready', function() {
    console.log('Asten | Ready');
});
