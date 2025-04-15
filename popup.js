let websiteData = [];

document.addEventListener("DOMContentLoaded", function () {
    // Request the website data from the background script
    chrome.runtime.sendMessage({ action: "getWebsiteList" });

    // Load settings
    initializeSavedSettings();    
    loadCompactViewState();

    // Set up tab switching
    setupTabs();

    // Set up generation buttons
    setupGenerationButtons();

    // Set up copy button
    setupCopyButton();

    // Set up settings change listeners
    setupSettingsListeners();

    // Set up compact view toggle
    setupCompactViewToggle();


    // Activate the first tab by default
    const firstTabButton = document.querySelector('.tab-button');
    if (firstTabButton) {
        switchTab(firstTabButton.getAttribute('data-tab'));
    }
    const settingsTab = document.getElementById('settings');
  console.log('Settings tab display style:', getComputedStyle(settingsTab).display);
});

function setupTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

// List of all Settings
const settingsKeys = [
    'bbcodeJobnumbering', 'bbcodeJobname', 'bbcodeJobcreator', 'bbcodeJobicon', 'bbcodeJobtype', 'bbcodeMaxplayers', 
    'bbcodeGtalens', 'bbcodeJobimage', 'bbcodeJobdescription', 'bbcodeLinebreak', 
    'bbcodeCreationdate', 'bbcodeLastupdated',
    'youtubeJobnumbering', 'youtubeJobtimestamp','youtubeJobname', 'youtubeJobcreator', 'youtubeJobtype', 'youtubeMaxplayers', 
    'youtubeGtalens', 'youtubeJobdescription', 'youtubeLinebreak', 'youtubeCreationdate', 
    'youtubeLastupdated', 
    'textJobnumbering','textJobname', 'textJobcreator', 'textJoburl', 'textJobtype', 'textMaxplayers', 
    'textGtalens', 'textJobdescription', 'textLinebreak', 'textCreationdate', 
    'textLastupdated',
    'csvJobname', 'csvJoburl', 'csvJobcreator', 'csvJobtype', 'csvMaxplayers', 'csvIncludeHeaders', 
    'csvGtalens', 'csvJobimage', 'csvJobdescription', 'csvCreationdate', 'csvLastupdated',
    'useCustomBBcode', 'customBBcode', 'useCustomCSVtext', 'customCSVtext',
    'jobviewMaxplayers','jobviewCreationdate','jobviewLastupdated','jobviewGtalens',
    'compactviewJobimage','compactviewGtalens'
];

// List of default Settings

const defaultSettings = {
    'bbcodeJobnumbering': true,
    'bbcodeJobname': true,
    'bbcodeJobcreator': true,
    'bbcodeJobicon': true,
    'bbcodeJobtype': true,
    'bbcodeMaxplayers': false,
    'bbcodeGtalens': false,
    'bbcodeJobimage': false,
    'bbcodeJobdescription': false,
    'bbcodeLinebreak': true,
    'bbcodeCreationdate': false,
    'bbcodeLastupdated': false,
    'youtubeJobnumbering': false,
    'youtubeJobtimestamp': true,
    'youtubeJobname': true,
    'youtubeJobcreator': true,
    'youtubeJobtype': true,
    'youtubeMaxplayers': false,
    'youtubeGtalens': false,
    'youtubeJobdescription': false,
    'youtubeLinebreak': false,
    'youtubeCreationdate': false,
    'youtubeLastupdated': false,
    'textJobnumbering': true,
    'textJobname': true,
    'textJobcreator': true,
    'textJoburl': false,
    'textJobtype': false,
    'textMaxplayers': false,
    'textGtalens': false,
    'textJobdescription': false,
    'textLinebreak': false,
    'textCreationdate': false,
    'textLastupdated': false,
    'csvJobname': true,
    'csvJoburl': true,
    'csvJobcreator': true,
    'csvJobtype': true,
    'csvMaxplayers': false,
    'csvGtalens': false,
    'csvJobimage': false,
    'csvJobdescription': false,
    'csvCreationdate': false,
    'csvLastupdated': false,
    'csvIncludeHeaders': false,
    'useCustomBBcode': false,
    'useCustomCSVtext': false,
    'jobviewMaxplayers': true,
    'jobviewCreationdate': true,
    'jobviewLastupdated': true,
    'jobviewGtalens': true,
    'compactviewJobimage': true,
    'compactviewGtalens': true,
    'customBBcode': '',
    'customCSVtext': ''
};


// Setings to default
function resetSettings() {
    // Clear the storage first
    chrome.storage.sync.clear(function() {
        console.log('Storage cleared.');

        // Use defaultSettings to set all the keys to default values
        chrome.storage.sync.set(defaultSettings, function() {
            console.log('Settings reset to default.');
            initializeSavedSettings(); // Reload settings to apply the defaults
        });
    });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Call resetSettings on button click
document.getElementById('resetSettingsButton').addEventListener('click', resetSettings);

function setupCompactViewToggle() {
    const compactViewToggle = document.getElementById('compactViewToggle');
    compactViewToggle.addEventListener('change', () => {
        isCompactView = compactViewToggle.checked;
        saveCompactViewState(); // Save the compact view state to localStorage
        displayWebsiteData(); // Update the UI
    });
}

function switchTab(tabId) {
    console.log('Switching to tab:', tabId);
    document.querySelectorAll('.tab-content').forEach(tab => {
        console.log(tab.id, 'visibility before:', getComputedStyle(tab).display);
        if (tab.id === tabId) {
            tab.classList.add('active');
            tab.style.display = 'block';

            // Show all settings sections when the Settings tab is active
            if (tabId === 'settings') {
                document.querySelectorAll('.settings-header, .settings-group').forEach(section => {
                    section.style.display = 'block';
                });
            } else {
                // Hide all settings sections when other tabs are active
                document.querySelectorAll('.settings-header, .settings-group').forEach(section => {
                    section.style.display = 'none';
                });
            }
        } else {
            tab.classList.remove('active');
            tab.style.display = 'none';
        }

        console.log(tab.id, 'visibility after:', getComputedStyle(tab).display);
    });

    // Update active state of tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function setupGenerationButtons() {
    document.getElementById('generateBBcode').addEventListener('click', () => generateContent('bbcode'));
    document.getElementById('generateYouTube').addEventListener('click', () => generateContent('youtube'));
    document.getElementById('generateText').addEventListener('click', () => generateContent('text'));
    document.getElementById('generateCSV').addEventListener('click', () => generateContent('csv'));
}

function setupCopyButton() {
    document.getElementById('copyButton').addEventListener('click', () => {
        const outputTextarea = document.getElementById('outputTextarea');
        outputTextarea.select();
        document.execCommand('copy');
        const copyButton = document.getElementById('copyButton');
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = 'Copy to Clipboard';
        }, 2000);
    });
}

function setupSettingsListeners() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', saveSettings);
    });
    document.getElementById('customBBcodeInput').addEventListener('input', saveSettings);
    document.getElementById('useCustomBBcode').addEventListener('change', saveSettings);
    document.getElementById('customCSVInput').addEventListener('input', saveSettings);
    document.getElementById('useCustomCSVtext').addEventListener('change', saveSettings);
}


function saveSettings() {
    console.log('Saving settings...');

    const settings = {};
    
    // Loop through the defined settings keys and store their current state
    settingsKeys.forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            // Save checkbox states or other elements like input values
            settings[key] = (element.type === 'checkbox') ? element.checked : element.value;
        }
    });

    settings.customBBcode = document.getElementById('customBBcodeInput').value;
    settings.customCSVtext = document.getElementById('customCSVInput').value;

    console.log('Settings to save:', settings);

    chrome.storage.sync.set(settings, () => {
        console.log('Settings saved.');
    });
}

function initializeSavedSettings() {
    console.log('Starting initializeSavedSettings');

    // Load the saved settings from storage
    chrome.storage.sync.get(settingsKeys, function(result) {
        settingsKeys.forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                // If the setting was saved, apply it; otherwise, apply the default value
                if (typeof result[key] !== 'undefined') {
                    if (element.type === 'checkbox') {
                        element.checked = result[key];
                    } else {
                        element.value = result[key];
                    }
                } else {
                    // Apply the default value from defaultSettings if not saved yet
                    if (element.type === 'checkbox') {
                        element.checked = defaultSettings[key];
                    } else {
                        element.value = defaultSettings[key];
                    }
                }
            }
        });

        chrome.storage.sync.get(null, function(data) {
            // Retrieve the saved values
            const customBBcode = data.customBBcode;
            const customCSVtext = data.customCSVtext;
    
            // Set the values of the text boxes
            document.getElementById('customBBcodeInput').value = customBBcode;
            document.getElementById('customCSVInput').value = customCSVtext;
        });

        console.log('Finished initializeSavedSettings');
    });
}

// Generate content
function generateContent(type) {
    let content = '';

    // Check if websiteData is available
    if (!websiteData || websiteData.length === 0) {
        alert('No website data available. Please make sure you have loaded the data first.');
        return;
    }

    // Get the settings for the specific type
    const settings = getTypeSpecificSettings(type);

    // Generate content based on type
    switch (type) {
        case 'bbcode':
            content = generateBBCode(settings);
            break;
        case 'youtube':
            content = generateYouTube(settings);
            break;
        case 'text':
            content = generateText(settings);
            break;
        case 'csv':
            content = generateCSV(settings);
            break;
        default:
            alert('Invalid content type');
            return;
    }

    // Update the output textarea
    document.getElementById('outputTextarea').value = content;
}

function getTypeSpecificSettings(type) {
    const settings = {};
    const prefix = type.toLowerCase();

    // Get all checkboxes with the specific prefix
    document.querySelectorAll(`input[type="checkbox"][id^="${prefix}"]`).forEach(checkbox => {
        const key = checkbox.id.replace(prefix, '').toLowerCase();
        settings[key] = checkbox.checked;
    });

    // Add any additional settings specific to the type
    if (type === 'bbcode') {
        settings.useCustomBBcode = document.getElementById('useCustomBBcode').checked;
        settings.customBBcode = document.getElementById('customBBcodeInput').value;
    } else if (type === 'csv') {
        settings.useCustomCSVtext = document.getElementById('useCustomCSVtext').checked;
        settings.customCSVtext = document.getElementById('customCSVInput').value;
        settings.includeHeaders = document.getElementById('csvIncludeHeaders').checked;
    }

    return settings;
}

// Helper functions for each content type
function generateBBCode(settings) {
    let content = '';
    websiteData.forEach((data, index) => {
        if (settings.jobnumbering) content += `${index + 1}. `;
        if (settings.jobicon) content += `${data.jobIcon} `;
        if (settings.jobtype) content += `${data.jobType} - `;
        if (settings.jobname) content += `[b][url=${data.url}]${data.jobName}[/url][/b] `;
        if (settings.jobcreator) content += `by @${data.jobCreator} `;        
        if (settings.maxplayers && data.maxPlayers !== "30") content += `(Max: ${data.maxPlayers}) `;
        if (settings.gtalens) content += `| [url=${data.GTALens}]GTALens[/url] `;
        if (settings.jobimage) content += `\n\n[img]${data.jobImage}[/img]\n\n`;
        if (settings.jobdescription) content += `${data.jobDescription} `;
        if (settings.creationdate) content += `\n[b]Created:[/b] ${data.creationDate} `;
        if (settings.lastupdated) content += `\n[b]Last Updated:[/b] ${data.lastUpdated} `;
        if (settings.useCustomBBcode) content += settings.customBBcode + ' ';
        if (settings.linebreak) content += '[br]';
        content += '\n';
    });
    return content.trim();
}

function generateYouTube(settings) {
    let content = '';
    
    websiteData.forEach((data, index) => {
        let line = '';
        
        // Add a placeholder timestamp (HH:MM:SS)
        if (settings.jobtimestamp) {
            line += 'HH:MM:SS '; // Placeholder for manual editing
        }
        
        // Include numbering if enabled
        if (settings.jobnumbering) {
            line += `${index + 1}. `;
        }
        
        // Job Name
        if (settings.jobname) {
            line += `${data.jobName} `;
        }
        
        // Job Creator
        if (settings.jobcreator) {
            line += `by ${data.jobCreator} `;
        }
        
        // Job Type
        if (settings.jobtype) {
            line += `| ${data.jobType} `;
        }
        
        // Max Players (exclude default value of "30")
        if (settings.maxplayers && data.maxPlayers !== "30") {
            line += `| Max Players: ${data.maxPlayers} `;
        }
        
        // GTALens Link
        if (settings.gtalens) {
            line += `| GTALens: ${data.GTALens} `;
        }
        
        // Job Description
        if (settings.jobdescription) {
            line += `\n${data.jobDescription} `;
        }
        
        // Creation Date
        if (settings.creationdate) {
            line += `\nCreated: ${data.creationDate} `;
        }
        
        // Last Updated Date
        if (settings.lastupdated) {
            line += `\nLast Updated: ${data.lastUpdated} `;
        }
        
        // Job URL
        line += `\n${data.url}`;
        
        // Add line breaks if enabled
        if (settings.linebreak) {
            line += '\n\n';
        } else {
            line += '\n';
        }
        
        content += line;
    });
    
    return content.trim();
}

function generateText(settings) {
    let content = '';
    
    websiteData.forEach((data, index) => {
        let line = '';
        
        if (settings.jobnumbering) {
            line += `${index + 1}. `;
        }
        
        if (settings.jobname) {
            line += `${data.jobName} `;
        }
        
        if (settings.jobcreator) {
            line += `by ${data.jobCreator} `;
        }

        if (settings.joburl) {  
            line += - `${data.url} `;
        }
        
        if (settings.jobtype) {
            line += `| Type: ${data.jobType} `;
        }
        
        if (settings.maxplayers) {
            line += `| Max Players: ${data.maxPlayers} `;
        }
        
        if (settings.gtalens) {
            line += `| GTALens: ${data.GTALens} `;
        }
        
        if (settings.jobdescription) {
            line += `\nDescription: ${data.jobDescription}`;
        }
        
        if (settings.creationdate) {
            line += `\nCreated: ${data.creationDate}`;
        }
        
        if (settings.lastupdated) {
            line += `\nLast Updated: ${data.lastUpdated}`;
        }
                
        if (settings.linebreak) {
            line += '\n\n';
        } else {
            line += '\n';
        }
        
        content += line;
    });
    
    return content.trim();
}

function generateCSV(settings) {
    let content = '';
    
    // Define custom header names
    const headerMappings = {
        jobnumbering: 'Number',
        jobtype: 'Job Type',
        jobname: 'Job Name',
        joburl: 'Job URL',
        jobcreator: 'Job Creator',
        maxplayers: 'Max Players',
        gtalens: 'GTALens Link',
        jobimage: 'Job Image',
        jobdescription: 'Job Description',
        creationdate: 'Date Created',
        lastupdated: 'Date Updated',
        customtext: 'Custom'
    };

    // Get enabled headers
   const enabledHeaders = Object.keys(settings).filter(key => 
    settings[key] && 
    key !== 'includeHeaders' && 
    key !== 'useCustomCSVtext' && 
    key !== 'customCSVtext' &&
    headerMappings.hasOwnProperty(key)  // Only include keys that have a mapping
);
    
    if (settings.useCustomCSVtext) {
        enabledHeaders.push('customtext');
    }

    // Add headers if option is enabled
      if (settings.includeHeaders) {
        content = enabledHeaders.map(key => headerMappings[key]).join(',') + '\n';
    }

    function escapeCsvField(field, fieldType) {
    if (field === null || field === undefined) {
        return '""';
    }
    
    field = String(field);
    
    // Double up any double quotes within the field
    field = field.replace(/"/g, '""');
    
    // Determine if the field should be quoted
    let needsQuoting = true;  // Default to true for most fields
    
    // Only numeric and date fields might not need quoting
    if (fieldType === 'jobnumbering' || fieldType === 'maxplayers' || 
        fieldType === 'creationdate' || fieldType === 'lastupdated') {
        
        // Check if the field is purely numeric
        if (/^-?\d+(\.\d+)?$/.test(field)) {
            needsQuoting = false;
        }
    }
    
    // Special handling for fields that could be interpreted as formulas
    if (/^[=+\-@]/.test(field)) {
        field = "'" + field;
        needsQuoting = true;
    }
    
    // If the field needs quoting, wrap it in double quotes
    return needsQuoting ? '"' + field + '"' : field;
}

    websiteData.forEach((data, index) => {
        let row = enabledHeaders.map(key => {
            let value = '';
            switch(key) {
                case 'jobnumbering': value = index + 1; break;
                case 'jobtype': value = data.jobType; break;
                case 'jobname': value = data.jobName; break;
                case 'joburl': value = data.url; break;
                case 'jobcreator': value = data.jobCreator; break;
                case 'maxplayers': value = data.maxPlayers; break;
                case 'gtalens': value = data.GTALens; break;
                case 'jobimage': value = data.jobImage; break;
                case 'jobdescription': value = data.jobDescription; break;
                case 'creationdate': value = data.creationDate; break;
                case 'lastupdated': value = data.lastUpdated; break;
                case 'customtext': value = settings.customCSVtext; break;
            }
            return escapeCsvField(value, key);
        });

        content += row.join(',') + '\n';
    });

    return content.trim();
}

// Save the compact view state to localStorage
function saveCompactViewState() {
    localStorage.setItem('isCompactView', isCompactView);
}

// Load the compact view state from localStorage
function loadCompactViewState() {
    const savedState = localStorage.getItem('isCompactView');
    isCompactView = savedState === 'true'; // Convert string to boolean
    const compactViewToggle = document.getElementById('compactViewToggle');
    compactViewToggle.checked = isCompactView; // Set the toggle state
}

function setupCompactViewToggle() {
    const compactViewToggle = document.getElementById('compactViewToggle');
    compactViewToggle.addEventListener('change', () => {
        isCompactView = compactViewToggle.checked;
        saveCompactViewState(); // Save the compact view state to localStorage
        displayWebsiteData();
    });
}

function displayWebsiteData() {
    chrome.storage.sync.get(['jobviewMaxplayers', 'jobviewCreationdate', 'jobviewLastupdated', 'jobviewGtalens' , 'compactviewGtalens' , 'compactviewJobimage' ], (settings) => {
        const websiteList = document.getElementById("websiteList");
        websiteList.innerHTML = "";
        
        websiteData.forEach(function (data) {
            const item = document.createElement("div");
            item.className = "job-item";

            if (isCompactView) {
                let compactHTML = `
                    <div style="display: flex; align-items: center;">
                        ${settings.compactviewJobimage ? `<img src="${data.jobImage}" alt="${data.jobName} Image" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">` : ''}
                        <div>
                            <p><strong><a href="${data.url}" style="color: #0066cc; text-decoration: none;">${data.jobName}</a></strong> by ${data.jobCreator} | ${data.jobType}</p>
                            ${settings.compactviewGtalens ? `<p><a href="${data.GTALens}" style="color: #0066cc; text-decoration: none;">GTALens</a></p>` : ''}
                        </div>
                    </div>
                `;
                item.innerHTML = compactHTML;
            } else {
                let fullHTML = `
                    <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">
                        <a href="${data.url}" style="color: #0066cc; text-decoration: none;">${data.jobName}</a>
                    </h3>
                    <p><strong>Creator:</strong> ${data.jobCreator}</p>
                    <p><strong>Type:</strong> ${data.jobType}</p>
                    ${settings.jobviewMaxplayers ? `<p><strong>Max Players:</strong> ${data.maxPlayers}</p>` : ''}
                    ${settings.jobviewCreationdate ? `<p><strong>Creation Date:</strong> ${data.creationDate}</p>` : ''}
                    ${settings.jobviewLastupdated ? `<p><strong>Last Updated:</strong> ${data.lastUpdated}</p>` : ''}
                    ${settings.jobviewGtalens ? `<p><strong>GTALens:</strong> <a href="${data.GTALens}" style="color: #0066cc; text-decoration: none;">GTALens</a></p>` : ''}
                    <img src="${data.jobImage}" alt="${data.jobName} Image" style="max-width: 100%; height: auto; margin-top: 10px;">
                    <p style="margin-top: 10px;">${data.jobDescription}</p>
                `;
                item.innerHTML = fullHTML;
            }
            websiteList.appendChild(item);
        });
    });
}

// Toggle the About section visibility
document.getElementById('moreInfoLink').addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default link behavior
    const aboutSection = document.getElementById('aboutSection');
    if (aboutSection.style.display === 'none') {
      aboutSection.style.display = 'block';
    } else {
      aboutSection.style.display = 'none';
    }
  });  
  
  // Tooltip delay
  document.querySelectorAll('.tooltip-wrapper').forEach(wrapper => {
    let timeoutId;
  
    wrapper.addEventListener('mouseenter', () => {
      clearTimeout(timeoutId);
      const tooltip = wrapper.querySelector('.tooltip');
      tooltip.style.visibility = 'visible';
      tooltip.style.opacity = '1';
    });
  
    wrapper.addEventListener('mouseleave', () => {
      timeoutId = setTimeout(() => {
        const tooltip = wrapper.querySelector('.tooltip');
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
      }, 300); // 300ms delay
    });
  });

chrome.runtime.onMessage.addListener(function (message) {
    if (message.action === "sendWebsiteData") {
        websiteData = message.data;
        displayWebsiteData();
    }
	
});
