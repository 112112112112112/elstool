fetch("./values.json")
.then(res => res.json())
.then(values => {
    const stats = values.stats;
    const colorSelect = document.getElementById("colorSelect");
    const shapeSelect = document.getElementById("shapeSelect");
    const partSelect = document.getElementById("partSelect");
    const effectSelect = document.getElementById("effectSelect");
    const valueSelect = document.getElementById("valueSelect");
    const circuitBuilder = document.getElementById("circuitBuilder");
    const inventory = document.getElementById("inventory");
    const armor = document.getElementById("armor");
    const table = document.getElementById("stats");
    
    let filteredEffects = [];
    let circuitCount = JSON.parse(localStorage.getItem("circuitCount")) || 0;
    
    let characters = JSON.parse(localStorage.getItem("characters")) || [];
    let activeCharacter = characters.length ? characters[0].name : null;
    const charNameInput = document.getElementById("charName");
    const charClassSelect = document.getElementById("classSelect");
    const charClassImg = document.getElementById("classImg");
    const characterBuilder = document.getElementById("characterBuilder");
    const characterList = document.getElementById("characterList");

    // * DOM * -------------------------------------------------------------------- //

    fetch("classes.json")
    .then(res => res.json())
    .then(classes => {
        // * Generate class dropdown list
        charClassSelect.innerHTML = "";

        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = "-- Choose your class --";
        emptyOption.disabled = true;
        emptyOption.selected = true;
        charClassSelect.appendChild(emptyOption);

        classes.forEach(c => {
            const option = document.createElement("option");
            option.value = c.name;
            option.textContent = c.name;
            option.dataset.img = c.img;
            
            charClassSelect.appendChild(option);
        });
    });

    charClassSelect.addEventListener("change", () => {
        const selectedClass = charClassSelect.selectedOptions[0];
        charClassImg.src = selectedClass.value ? selectedClass.dataset.img : "";
    })

    // * Generate table based on circuit values JSON
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
            const equip = document.createElement("button");

            // TODO: maybe displaying circuit id doesnt matter
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

            equip.classList.add("btn")
            equip.textContent = "🔁";
            equip.addEventListener("click", () => {
                moveCircuit(char, circuit, "toArmor");
            });
        
            output.append(img, text, remove, equip);
            inventory.appendChild(output);
        });
    }

    // * Create a circuit and store it in the active character's inventory
    circuitBuilder.addEventListener("click", () => {
        if (!activeCharacter) return;
        const char = characters.find(c => c.name === activeCharacter);
        if (!char) return;

        circuitCount++;
        localStorage.setItem("circuitCount", circuitCount);

        const circuit = {
            id: circuitCount,
            img: `img/${shapeSelect.value}-${partSelect.value}-${colorSelect.value}.png`,
            text: `${effectSelect.value} +${valueSelect.value}`,
            part: partSelect.value
        };

        char.inventory.push(circuit);
        localStorage.setItem("characters", JSON.stringify(characters));
        renderInventory();
    });

    // * Inventory Initialization
    updateEffectsList();
    renderInventory();

    // * ARMOR * -------------------------------------------------------------------- //

    function renderArmor() {
        if (!activeCharacter) return;
        const char = characters.find(c => c.name === activeCharacter);
        if (!char) return;

        ["top", "bottom", "gloves", "shoes"].forEach(part => {
            const col = document.getElementById(`armor-${part}`);
            col.innerHTML = "";

            // * Armors can have up to 15 circuits per part
            for (let i = 0; i < 15; i++) {
                const slot = document.createElement("div");
                slot.classList.add("armor-slot", "col", "me-2");

                if (char.armor[part][i]) {
                    const circuit = char.armor[part][i];
                    const img = document.createElement("img");
                    const text = document.createElement("p")
                    const equip = document.createElement("button");

                    img.src = circuit.img;
                    img.width = 50;
                    text.textContent = circuit.text;
                    equip.classList.add("btn");
                        equip.textContent = "🔁";
                        equip.addEventListener("click", () => {
                            moveCircuit(char, circuit, "toInventory");
                        });

                    slot.append(img, text, equip);
                } else {
                    // TODO: move this to actual css
                    slot.style.border = "1px solid #aaa";
                    slot.style.height = "50px";
                    slot.style.width = "50px";
                }
                col.appendChild(slot);
            }
        });
    }

    /**
     * ? Moves a circuit from a character's inventory to their armor or viceversa
     * @param {*} char 
     * @param {*} circuit 
     * @param {*} location (toArmor, toInventory)
     * @returns 
     */
    function moveCircuit(char, circuit, location) {
        /**
         * TODO: filter slots maybe?? drag and drop??
         * * Filtering slots would have to check for every possible circuit combination.
         * * e.g.   Top Piece
         * *        - x4 I-1
         * *        - x3 L-1
         * *        - x3 L-2
         * *        - x3 L-3
         * *        - x2 L-4
         * * Otherwise, see how to make it be able to tell if it's connected or not.
         * * Display the total buff amount regardless.
         * TODO: Move circuits between characters' inventories
         */
        const part = circuit.part;
        if (location == "toArmor") {
            const emptyIndex = char.armor[part].findIndex(c => c === null);
            if (emptyIndex === -1) return alert(`${part} is already full`);
    
            char.armor[part][emptyIndex] = circuit;
            char.inventory = char.inventory.filter(c => c.id !== circuit.id);
        } else if (location == "toInventory") {
            const slotIndex = char.armor[part].findIndex(c => c && c.id === circuit.id);
            if (slotIndex === -1) return;

            char.armor[part][slotIndex] = null;
            char.inventory.push(circuit);
        }
        
        localStorage.setItem("characters", JSON.stringify(characters));
        renderInventory();
        renderArmor();
    }

    // * CHARACTERS * -------------------------------------------------------------------- //

    /**
     *? Show a list of every character with their class icon and name
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
                    renderArmor();
                }
                renderCharacter();
            }); 
            
            output.append(img, text, remove);
            characterList.appendChild(output);
            output.style.border = ""

            // ? Update view when swapping to another character
            output.addEventListener("click", (e) => {
                if (e.target === remove) return;
                activeCharacter = c.name;
                renderInventory();
                renderArmor();
            })
        });
    }

    // ? Character creation form
    characterBuilder.addEventListener("click", () => {
        const charName = charNameInput.value.trim();
        const charClass = charClassSelect.value;
        if (!charName) return alert("You must input a name");
        if (!charClass) return alert("You must select a class");
        if (characters.find(c => c.name === charName)) return alert("There is already a character with that name");

        const newChar = {
            name: charName,
            class: charClass,
            inventory: [],
            armor: {
                top: Array(15).fill(null),
                bottom: Array(15).fill(null),
                gloves: Array(15).fill(null),
                shoes: Array(15).fill(null)
            },
        };

        characters.push(newChar);
        localStorage.setItem("characters", JSON.stringify(characters));
        activeCharacter = charName;
        charNameInput.value = "";
        renderInventory();
        renderArmor();
        renderCharacter();
    });

    // Initialization
    renderCharacter();
    if (activeCharacter) {
        renderInventory();
        renderArmor();
    }
});