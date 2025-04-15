chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);

  if (request.action === "getWebsiteList") {
    chrome.tabs.query({}, (tabs) => {
      // Filter for gtav job tabs (both patterns)
      const gtavJobTabs = tabs.filter(tab =>
        tab && tab.url && tab.url.startsWith("https://socialclub.rockstargames.com/job/gtav/") 
      );

      // Filter for playlist tabs
      const playlistTabs = tabs.filter(tab =>
        tab && tab.url && tab.url.startsWith("https://socialclub.rockstargames.com/games/gtav/")
      );

      // If no gtav job tabs exist but playlist tabs do, process the playlist tabs
      if (gtavJobTabs.length === 0 && playlistTabs.length > 0) {
        preloadBasePage().then(() => {
          playlistTabs.forEach(playlistTab => {
            scrapeAndOpenJobLinks(playlistTab.id);
          });
        });
      } else {
        // Process existing gtav job tabs
        const websiteData = gtavJobTabs.map(tab => ({
          tabId: tab.id,
          url: tab.url,
          jobName: "",
          jobCreator: "",
          jobType: "",
          jobDescription: "",
          jobImage: "",
          GTALens: "",
          maxPlayers: "",
          jobIcon: "",
          creationDate: "",
          lastUpdated: ""
        }));

        let counter = 0;

        function scrapeWebsiteData(tabId) {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            function: () => {
              const jobNameElement = document.evaluate("//h1[contains(@class, 'Ugc__title__')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              const jobCreatorElement = document.evaluate("//a[contains(@class, 'UI__PlayerCard__username')]/span", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              const jobTypeElement = document.evaluate("//div[div/text()='Game Mode']/div[2]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              const jobDescriptionElement = document.evaluate("//p[contains(@class, 'Ugc__description__')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              const jobImageElement = document.evaluate("//img[contains(@class, 'Ugc__missionImage__')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              const maxPlayersElement = document.evaluate("//div[div/div/text()='Players']/div[2]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              const creationDateElement = document.evaluate("//div[div/div/text()='Creation Date']/div[2]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              const lastUpdatedElement = document.evaluate("//div[div/div/text()='Last Updated']/div[2]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              const GTALensElement = document.querySelector('a.UI__Button-socialclub__btn');

              const jobName = jobNameElement ? jobNameElement.textContent.trim() : '';
              const jobCreator = jobCreatorElement ? jobCreatorElement.textContent.trim() : '';
              const jobType = jobTypeElement ? jobTypeElement.textContent.trim() : '';
              const jobDescription = jobDescriptionElement ? jobDescriptionElement.textContent.trim() : '';
              const jobImage = jobImageElement ? jobImageElement.src.trim() : '';
              const maxPlayers = maxPlayersElement ? maxPlayersElement.textContent.trim() : '';
              const creationDate = creationDateElement ? creationDateElement.textContent.trim() : '';
              const lastUpdated = lastUpdatedElement ? lastUpdatedElement.textContent.trim() : '';
              const GTALens = GTALensElement ? GTALensElement.href.trim() : '';

              return {
                jobName,
                jobCreator,
                jobType,
                jobDescription,
                jobImage,
                GTALens,
                maxPlayers,
                creationDate,
                lastUpdated
              };
            }
          }, (results) => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              return;
            }

            const result = results[0].result;
            const dataEntry = websiteData.find(entry => entry.tabId === tabId);
            if (dataEntry && result) {
              Object.assign(dataEntry, result);
              dataEntry.jobIcon = getJobIcon(dataEntry.jobType);
              updateJobType(dataEntry);
            }

            counter++;
            if (counter === gtavJobTabs.length) {
              chrome.runtime.sendMessage({ action: "sendWebsiteData", data: websiteData });
            }
          });
        }

        gtavJobTabs.forEach(tab => scrapeWebsiteData(tab.id));
      }
    });
  } else if (request.action === "saveCustomBBcode") {
    chrome.storage.sync.set({ customBBcode: request.customBBcode });
  } else if (request.action === "saveCheckboxConfig") {
    chrome.storage.sync.set({ checkboxConfig: request.checkboxConfig });
  }
  return true;
});

function preloadBasePage() {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: "https://socialclub.rockstargames.com/", active: false }, (tab) => {
      const checkIfLoaded = setInterval(() => {
        chrome.tabs.get(tab.id, (updatedTab) => {
          if (chrome.runtime.lastError) {
            clearInterval(checkIfLoaded);
            reject(chrome.runtime.lastError);
            return;
          }
          if (updatedTab.status === "complete") {
            clearInterval(checkIfLoaded);
            chrome.tabs.remove(tab.id); // Close the preloaded tab
            resolve();
          }
        });
      }, 500); // Check every 500ms
    });
  });
}

function scrapeAndOpenJobLinks(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: () => {
      // Extract all job links from the DOM
      const jobLinks = Array.from(document.querySelectorAll('a.mission[data-id]'))
        .map(link => `https://socialclub.rockstargames.com/job/gtav/${link.getAttribute('data-id')}`);

      // Deduplicate the links using a Set
      const uniqueJobLinks = [...new Set(jobLinks)];
      return uniqueJobLinks;
    }
  }, (results) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    const uniqueJobLinks = results[0].result;
    uniqueJobLinks.forEach(link => {
      chrome.tabs.create({ url: link });
    });
  });
}

function updateJobType(dataEntry) {
  var lowerCaseJobName = dataEntry.jobName.toLowerCase();
  var lowerCaseJobDescription = dataEntry.jobDescription.toLowerCase();
  if (dataEntry.jobType === "Stunt Race" || dataEntry.jobType === "Land Race" || dataEntry.jobType === "Transform Race") {
    if (
      lowerCaseJobName.includes("bang") ||
      lowerCaseJobDescription.includes("bang") ||
      lowerCaseJobName.includes("crash") ||
      lowerCaseJobDescription.includes("crash") ||
      lowerCaseJobName.includes("face to face") ||
      lowerCaseJobDescription.includes("face to face") ||
      lowerCaseJobName.includes("face 2 face") ||
      lowerCaseJobDescription.includes("face 2 face") ||
      lowerCaseJobName.includes("cara a cara") ||
      lowerCaseJobDescription.includes("cara a cara") ||
      lowerCaseJobDescription.includes("caracara") ||
      lowerCaseJobName.includes("derby") ||
      lowerCaseJobDescription.includes("derby") ||
      lowerCaseJobName.includes("destruction") ||
      lowerCaseJobDescription.includes("destruction") ||
      lowerCaseJobName.includes("f2f") ||
      lowerCaseJobDescription.includes("f2f")
    ) {
      dataEntry.jobType = "Banger Race";
    } else if (
      lowerCaseJobName.includes("wallride") ||
      lowerCaseJobName.includes("ribbon") ||
      lowerCaseJobName.includes("tsl") ||
      lowerCaseJobDescription.includes("wallride") ||
      lowerCaseJobDescription.includes("ribbon") ||
      lowerCaseJobDescription.includes("stunt") ||
      lowerCaseJobDescription.includes("tsl") ||
      lowerCaseJobDescription.includes("spiral") ||
      lowerCaseJobDescription.includes("auotmatic") ||
      lowerCaseJobDescription.includes("proonly")
    ) {
      dataEntry.jobType = "Stunt Race";
    } else if (
      lowerCaseJobName.includes("rally") ||
      lowerCaseJobName.includes("rx") ||
      lowerCaseJobName.includes("stage") ||
      lowerCaseJobDescription.includes("rally") ||
      lowerCaseJobDescription.includes("rx") ||
      lowerCaseJobDescription.includes("stage")
    ) {
      dataEntry.jobType = "Off-Road Race";
    } else if (
      lowerCaseJobName.includes("kour") ||
      lowerCaseJobName.includes("panto raider") ||
      lowerCaseJobName.includes("parcour") ||
      lowerCaseJobDescription.includes("kour") ||
      lowerCaseJobDescription.includes("panto raider") ||
      lowerCaseJobDescription.includes("parcour")
    ) {
      dataEntry.jobType = "Parkour Race";  
    } else {
      dataEntry.jobType = "Race";
    }
  } else if (dataEntry.jobType === "Team Deathmatch") {
    if (
      lowerCaseJobDescription.includes("life") ||
      lowerCaseJobDescription.includes("lives") ||
      lowerCaseJobDescription.includes("limited")
    ) {
      dataEntry.jobType = "Limited Life Team Deathmatch";
    }
  } else if (dataEntry.jobType === "Deathmatch") {
    if (lowerCaseJobDescription.includes("life") || lowerCaseJobDescription.includes("lives")) {
      dataEntry.jobType = "Limited Life Deathmatch";
    }
  } else if (
    dataEntry.jobType === "Last Team Standing" ||
    dataEntry.jobType === "King of the Hill" ||
    dataEntry.jobType === "Team King of the Hill" ||
    dataEntry.jobType === "Transform Race" ||
    dataEntry.jobType === "Open Wheel Race" ||
    dataEntry.jobType === "Survival" ||
    dataEntry.jobType === "Air Race" ||
    dataEntry.jobType === "Bike Race" ||
    dataEntry.jobType === "Sea Race" ||
    dataEntry.jobType === "Capture"
  ) {
    // Keep these JobTypes as is
  } else if (dataEntry.jobType === "2") {
    dataEntry.jobType = "Vehicle Deathmatch";
  } else {
    dataEntry.jobType = "Race";
  }
}

function getJobIcon(jobType) {
  if (jobType === "Team Deathmatch" || jobType === "Deathmatch") {
    return ":tdm:";
  } else if (jobType === "King of the Hill" || jobType === "Team King of the Hill") {
    return ":koth:";
  } else if (jobType === "Last Team Standing") {
    return ":lts:";
  } else if (jobType === "Transform Race") {
    return ":transform:";
  } else if (jobType === "Stunt Race") {
    return ":stunt:";
  } else if (jobType === "Open Wheel Race") {
    return ":open:";
  } else if (jobType === "Parkour Race") {
    return ":parkour:";  
  } else if (jobType === "Survival") {
    return ":survival:";
  } else if (jobType === "Air Race") {
    return ":air:";
  } else if (jobType === "Bike Race") {
    return ":bike:";
  } else if (jobType === "Sea Race") {
    return ":sea:";
  } else if (jobType === "Capture") {
    return ":capture:";
  } else if (jobType === "Vehicle Deathmatch") {
    return ":vdm:";
  } else {
    return ":race:"; // Return :race: for default Race type
  }
}