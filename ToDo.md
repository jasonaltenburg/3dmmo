# Next Steps TODO

1. **Implement Player Inventory Logic**
   - Confirm or create a `Player.addItem(item)` method that sorts items into equipment vs consumables.
   - Ensure `takeDamage()` or buff logic is consistent with items.
   - Would like to start with an inventory and be able to sell and swap items.

2. **Build Inventory UI**
   - In `GameUI`, create an `updateInventory(inventory)` method that populates `#equipment-tab` and `#consumables-tab`.
   - Consider adding event handlers (e.g. equip, consume, sell).

3. **Shop Implementation**
   - Add a `toggleShop()` or `openShop()` method in `GameUI` to show/hide the `#shop-panel`.
   - Fill it with sample items. On purchase, dispatch a `buy-item` event.

