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
    const valueUnit = document.getElementById("valueUnit");
    const circuitBuilder = document.getElementById("circuitBuilder");
    const circuitOutput = document.getElementById("circuitOutput");
    const table = document.getElementById("stats");
    let circuitCount = 0;
    let filteredEffects = [];
    
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

    // -------------------------------------------------------------------- //
    

    /**
     ** Updates effect value unit dropdown list based on its type (percent/flat)
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
     ** Updates effects dropdown list based on the selected piece (top/bottom/gloves/shoes)
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

    circuitBuilder.addEventListener("click", () => {
        const output = document.createElement("div");
        const img = document.createElement("img");
        const text = document.createElement("p");
        const remove = document.createElement("span");

        circuitCount++;
        output.classList.add("col", `circuit-output-${circuitCount}`);
        img.src = `img/${shapeSelect.value}-${partSelect.value}-${colorSelect.value}.png`;
        text.textContent = `${effectSelect.value} +${valueSelect.value}`;

        remove.classList.add(`circuit-remove-${circuitCount}`)
        remove.textContent = "❌";
        remove.style.cursor = "pointer";
        remove.addEventListener("click", () => output.remove());

        output.appendChild(img);
        output.appendChild(text);
        output.appendChild(remove)
        circuitOutput.appendChild(output);
    })

    // initialization
    updateEffectsList();
});

