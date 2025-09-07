fetch("./values.json")
.then(res => res.json())
.then(values => {
    // ** Create table based on JSON
    const stats = values.stats;
    const colorSelect = document.getElementById("colorSelect");
    const shapeSelect = document.getElementById("shapeSelect");
    const partSelect = document.getElementById("partSelect");
    const effectSelect = document.getElementById("effectSelect");
    const valueSelect = document.getElementById("valueSelect");
    const characterSelect = document.getElementById("characterSelect")
    const circuitBuilder = document.getElementById("circuitBuilder");
    const inventory = document.getElementById("inventory");
    const table = document.getElementById("stats");
    
    let filteredEffects = [];
    let circuitCount = JSON.parse(localStorage.getItem("circuitCount")) || 0;
    
    let characters = JSON.parse(localStorage.getItem("characters")) || [];
    let activeCharacter = characters.length ? characters[0].name : null;
    const charNameInput = document.getElementById("charName");
    const charClassSelect = document.getElementById("charClass");
    const characterBuilder = document.getElementById("characterBuilder");
    const characterList = document.getElementById("characterList");

    // * DOM * -------------------------------------------------------------------- //

    const header = table.insertRow();
    Object.keys(stats[0]).forEach(key => {
        const th = document.createElement("th");
        th.textContent = key;
        header.appendChild(th);
    });
    
    stats.forEach(stat => {
        const row = table.insertRow();
        Object.values(stat).forEach(v => {
            const cell = row.insertCell();
            cell.textContent = v;
        });
    });

    // * CIRCUITS * -------------------------------------------------------------------- //

    /**
     *? Updates effect value unit dropdown list based on its type (percent/flat)
     * @param {*} effect 
     */
    function updateEffectInputs(effect) {
        const type = (effect.type ?? "").toLowerCase().trim();
        const step = type === "percent" ? 0.1 : 1;
        const min = effect.minLI ?? 0;
        const max = effect.max ?? min;
        
        valueSelect.innerHTML = "";

        for (let v = min; v <= max; v += step) {
            const value = type === "percent" ? parseFloat(v.toFixed(2)) : v;
            const option = document.createElement("option");
            option.value = value;
            option.textContent = type === "percent" ? value + "%" : "+" + value;
            valueSelect.appendChild(option);
        }

        valueSelect.selectedIndex = 0;
    }

    /**
     *? Updates effects dropdown list based on the selected piece (top/bottom/gloves/shoes)
     */
    function updateEffectsList() {
        filteredEffects = stats.filter(stat => stat.part === "general" || stat.part === partSelect.value);
        effectSelect.innerHTML = "";

        filteredEffects.forEach(stat => {
            let option = document.createElement("option");
            option.value = stat.effect;
            option.textContent = stat.effect;
            effectSelect.appendChild(option);
        });

        if (filteredEffects.length > 0) {
            const firstEffect = filteredEffects[0];
            effectSelect.value = firstEffect.effect;
            updateEffectInputs(firstEffect);
        }
    }

    partSelect.addEventListener("change", updateEffectsList);

    effectSelect.addEventListener("change", () => {
        const effect = filteredEffects.find(stat => stat.effect === effectSelect.value);
        if (effect) {
            updateEffectInputs(effect);
        }
    });

    /**
     *? Build circuit inventory per character
     * @param {*} circuit 
     */
    function renderInventory() {
        inventory.innerHTML = "";
        if (!activeCharacter) return;
        const char = characters.find(c => c.name === activeCharacter);
        if (!char) return;

        char.inventory.forEach(circuit => {
            const output = document.createElement("div");
            const img = document.createElement("img");
            const text = document.createElement("p");
            const remove = document.createElement("span");

            output.classList.add("col", `circuit-output-${circuit.id}`);
            img.src = circuit.img;
            text.textContent = circuit.text;

            remove.textContent = "❌";
            remove.style.cursor = "pointer";
            remove.addEventListener("click", () => {
                char.inventory = char.inventory.filter(c => c.id !== circuit.id);
                localStorage.setItem("characters",  JSON.stringify(characters));
                output.remove();
            });
        
            output.appendChild(img);
            output.appendChild(text);
            output.appendChild(remove)
            inventory.appendChild(output);
        });
    }

    circuitBuilder.addEventListener("click", () => {
        if (!activeCharacter) return;
        const char = characters.find(c => c.name === activeCharacter);
        if (!char) return;

        circuitCount++;
        localStorage.setItem("circuitCount", circuitCount);

        const circuit = {
            id: circuitCount,
            img: `img/${shapeSelect.value}-${partSelect.value}-${colorSelect.value}.png`,
            text: `${effectSelect.value} +${valueSelect.value}`
        };

        char.inventory.push(circuit);
        localStorage.setItem("characters", JSON.stringify(characters));
        renderInventory();
    });

    // * Inventory Initialization
    updateEffectsList();
    renderInventory();

    // * CHARACTERS * -------------------------------------------------------------------- //

    // TODO: Refactoring Characters and Inventory

    characterSelect.addEventListener("change", () => {
        activeCharacter = characterSelect.value;
        renderInventory();
    });

    /**
     *? Show a list of every character with their class icon and name and update characters dropdown list
     */
    function renderCharacter() {
        characterList.innerHTML = "";
        characters.forEach(c => {
            const output = document.createElement("div");
            const img = document.createElement("img");
            const text = document.createElement("span");
            const remove = document.createElement("span");

            output.classList.add("col", `character-${c.class}-${c.name}`);
            img.src = `img/classes/${c.class}.png`;
            img.width = 50;
            text.textContent = c.name;
            text.classList.add("mx-2");
            
            remove.textContent = "❌";
            remove.style.cursor = "pointer";
            remove.addEventListener("click", () => {
                characters = characters.filter(char => char.name !== c.name);
                localStorage.setItem("characters",  JSON.stringify(characters));

                if (activeCharacter === c.name) {
                    activeCharacter = characters.length ? characters[0].name : null;
                    renderInventory();
                }
                
                renderCharacter();
            });
            
            output.appendChild(img);
            output.appendChild(text);
            output.appendChild(remove);
            characterList.appendChild(output);
        });

        characterSelect.innerHTML = "";
        characters.forEach(c => {
            let option = document.createElement("option");
            option.value = c.name;
            option.textContent = c.name;
            characterSelect.appendChild(option);
        });

        if (activeCharacter) characterSelect.value = activeCharacter;
    }

    characterBuilder.addEventListener("click", () => {
        const charName = charNameInput.value.trim();
        const charClass = charClassSelect.value;
        if (!charName) return alert("You must input a name");
        if (characters.find(c => c.name === charName)) return alert("There is already a character with that name");

        const newChar = {
            name: charName,
            class: charClass,
            inventory: [],
            armor: [],
        };

        characters.push(newChar);
        localStorage.setItem("characters", JSON.stringify(characters));
        activeCharacter = charName;
        charNameInput.value = "";
        renderInventory();
        renderCharacter();
    });

    // Character Initialization
    renderCharacter();
    if (activeCharacter) renderInventory();
});
