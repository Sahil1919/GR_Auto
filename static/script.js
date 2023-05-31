const dropArea = document.querySelector(".drag-image");
const dragText = dropArea.querySelector("h6");
const button = dropArea.querySelector("button");
const submitButton = document.querySelector("#submitButton");
const loadingSpinner = document.querySelector("#loadingSpinner");
const input = dropArea.querySelector("input");
let files = [];

button.onclick = () => {
  input.click();
};

input.addEventListener("change", (e) => {
  for (let file of Array.from(e.target.files)) {
    files.push(file);
    let item = document.createElement("li");
    item.textContent = file.webkitRelativePath;
    input.appendChild(item);
  }
  console.log(files);
});

dropArea.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropArea.classList.add("active");
  dragText.textContent = "Release to Upload File";
});

dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("active");
  dragText.textContent = "Drag & Drop to Upload File";
});

dropArea.addEventListener("drop", (event) => {
  event.preventDefault();

  if (event.dataTransfer.items) {
    const directoryItems = event.dataTransfer.items;
    for (let i = 0; i < directoryItems.length; i++) {
      const entry = directoryItems[i].webkitGetAsEntry();
      if (entry.isDirectory) {
        traverseDirectory(entry);
      }
    }
  }
});

function traverseDirectory(directoryEntry, path = "") {
  const reader = directoryEntry.createReader();

  reader.readEntries(function (entries) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.isDirectory) {
        traverseDirectory(entry, `${path}${entry.name}/`);
      } else {
        entry.file(function (file) {
          files.push(file);
          let item = document.createElement("li");
          item.textContent = `${file.name}`;
          input.appendChild(item);
        });
      }
    }
  });
  console.log(files);
}

submitButton.addEventListener("click", () => {
  if (files.length > 0) {
    const fileName = prompt("Enter the filename for the report:");

    submitButton.disabled = true;
    submitButton.style.color = "#3498db";
    submitButton.classList.add("loading");
    loadingSpinner.style.display = "flex";

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    fetch("http://localhost:5000/uploads", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        submitButton.style.color = "#3498db";
        submitButton.classList.add("loading");
        loadingSpinner.style.display = "flex";

        // Simulate a delay for demonstration purposes
        setTimeout(() => {
          alert("Files submitted successfully!");

          submitButton.classList.remove("loading");
          loadingSpinner.style.display = "none";
          submitButton.style.color = "#fff";

          // Reset the file input and files array
          input.value = "";
          files = [];

          // Clear the drop area content
          dropArea.innerHTML = `
          <div class="icon"><i class="fas fa-cloud-upload-alt"></i></div>
          <h6>Drag & Drop File Here</h6>
          <span>OR</span>
          <button>Browse File</button>
        `;

          const startTime = new Date().getTime();

          // Trigger file download
          fetch("http://localhost:5000/download_excel")
            .then((response) => response.blob())
            .then((blob) => {
              // Calculate the duration of the request
              const duration = new Date().getTime() - startTime;

              // Adjust the delay duration based on the request duration
              const delayDuration = Math.max(0, 3000 - duration);

              // Create a temporary URL for the blob object
              const url = URL.createObjectURL(blob);

              // Create a link element and simulate a click to trigger the download
              const link = document.createElement("a");
              link.href = url;
              link.download = fileName + ".xlsx";
              link.click();

              // Hide loading spinner after the delay duration
              setTimeout(() => {
                loadingSpinner.style.display = "none";
              }, delayDuration);
            })
            .catch((error) => {
              // Hide loading spinner
              loadingSpinner.style.display = "none";
              document.getElementById("submitButton").style.color = "#fff";
              // Handle errors
              console.error("Error:", error);
            });
        }, 3000);
      })
      .catch((error) => {
        console.log(error);
        submitButton.disabled = false;
        alert("An error occurred while processing the files.");
      });
  } else {
    alert("No files selected");
  }
});
