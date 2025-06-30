let nodes = [];
let network;
let employeeMap = {};
let uploadedFile = null;

document.getElementById('upload').addEventListener('change', function (e) {
  uploadedFile = e.target.files[0];
  handleFile(e);
}, false);

document.getElementById('close').onclick = () => {
  document.getElementById('popup').style.display = 'none';
};

document.getElementById('toggleTheme').addEventListener('change', () => {
  document.body.classList.toggle('dark-mode');
});

function handleFile(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    drawTree(jsonData);
  };
  reader.readAsArrayBuffer(file);
}

function drawTree(data) {
  const edges = [];
  const staffNoMap = {};
  nodes = [];
  employeeMap = {};

  data.forEach((emp) => {
    const id = emp["Staff No"];
    staffNoMap[id] = true;
    employeeMap[id] = emp;

    nodes.push({
      id: id,
      label: `${emp["Employee Name"]}\n(${emp["Designation"]})`,
      shape: "box",
      font: { size: 14 },
      margin: 10,
      widthConstraint: { minimum: 160 },
      heightConstraint: { minimum: 60 },
      title: `<strong>${emp["Employee Name"]}</strong><br>Designation: ${emp["Designation"]}<br>Staff No: ${emp["Staff No"]}`
    });
  });

  data.forEach((emp) => {
    const from = emp["Parent"];
    const to = emp["Staff No"];
    if (from && staffNoMap[from]) {
      edges.push({ from, to });
    }
  });

  const container = document.getElementById("network");
  const visData = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
  };

  const options = {
    layout: {
      hierarchical: {
        enabled: true,
        direction: "UD",
        levelSeparation: 150,
        nodeSpacing: 180,
      }
    },
    autoResize: false,
    interaction: {
      dragNodes: true,
      dragView: false,
      zoomView: false,
      selectable: true,
      hover: true
    },
    nodes: {
      borderWidth: 1,
      shape: "box",
      color: {
        border: "#333",
        background: "#dee3fa",
        highlight: { border: "#2b7ce9", background: "#cde4ff" }
      },
      font: { size: 14 }
    },
    edges: {
      arrows: { to: true },
      color: "#555"
    },
    physics: false
  };

  network = new vis.Network(container, visData, options);

  network.on("click", function (params) {
    if (params.nodes.length > 0) {
      const id = params.nodes[0];
      const emp = employeeMap[id];
      document.getElementById("popupDetails").innerHTML = `
        <h3>${emp["Employee Name"]}</h3>
        <p><strong>Designation:</strong> ${emp["Designation"]}</p>
        <p><strong>Staff No:</strong> ${emp["Staff No"]}</p>
        <p><strong>Reports To:</strong> ${emp["Parent"] || "None"}</p>
        <p><strong>S No:</strong> ${emp["S No."]}</p>
      `;
      document.getElementById("popup").style.display = "block";
    }
  });
}

function searchNode() {
  const searchText = document.getElementById("searchBox").value.toLowerCase();
  const found = nodes.find(n => n.label.toLowerCase().includes(searchText));
  if (found) {
    network.selectNodes([found.id]);
    network.focus(found.id, { scale: 1.5, animation: true });
  } else {
    alert("No match found.");
  }
}

function exportAsImage() {
  const canvas = document.querySelector("canvas");
  const link = document.createElement("a");
  link.download = "hierarchy.png";
  link.href = canvas.toDataURL();
  link.click();
}

function resetView() {
  network.fit({ animation: true });
  network.unselectAll();
}

function zoomIn() {
  const scale = network.getScale();
  network.moveTo({ scale: scale + 0.2 });
}

function zoomOut() {
  const scale = network.getScale();
  network.moveTo({ scale: scale - 0.2 });
}

function toggleFullScreen() {
  const elem = document.getElementById("network");
  if (!document.fullscreenElement) {
    elem.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function downloadExcel() {
  if (!uploadedFile) return alert("No file uploaded.");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(uploadedFile);
  link.download = uploadedFile.name;
  link.click();
}
