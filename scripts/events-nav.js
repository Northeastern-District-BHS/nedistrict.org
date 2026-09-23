const baseEventsNavHtml = `
  <div class="header-nav-item header-nav-item--folder">
    <button class="header-nav-folder-title" data-href="/events" data-animation-role="header-element" aria-expanded="false" aria-controls="events">
      <span class="header-nav-folder-title-text">Events</span>
    </button>
    <div class="header-nav-folder-content" id="events"></div>
  </div>
`;

const baseMobileEventsNavHtml = `
  <div class="container header-menu-nav-item">
    <a data-folder-id="/events" href="/events">
      <div class="header-menu-nav-item-content header-menu-nav-item-content-folder">
        <span class="visually-hidden">Folder:</span>
        <span class="header-nav-folder-title-text">Events</span>
      <span style="margin-left: 0.15em; width: 1em; height: 1em;" class="header-dropdown-icon header-dropdown-flip"><svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" stroke-linecap="square" stroke-linejoin="miter" stroke-width="0.5px"><use href="#openArrowHead"></use></svg></span></div>
    </a>
  </div>
`;

const baseMobileEventsDataFolderHtml = `
  <div data-folder="/events" class="header-menu-nav-folder">
    <div class="header-menu-nav-folder-content" id="mobile-events">
      <div class="header-menu-controls container header-menu-nav-item">
        <a class="header-menu-controls-control header-menu-controls-control--active" data-action="back" href="/" tabindex="0"><span style="margin-right: 0.15em; width: 1em; height: 1em;" class="header-dropdown-icon header-dropdown-flip"><svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" stroke-linecap="square" stroke-linejoin="miter" stroke-width="0.5px"><use href="#openArrowHead"></use></svg></span>
          <span>Back</span>
        </a>
      </div>
    </div>
  </div>
`;

async function updateEventsNav() {
  const eventPageData = await getEventPageData();
  const upcomingEvents = eventPageData
    .upcoming
    .filter((event) => event.starred);

  if (!upcomingEvents || upcomingEvents.length === 0)
    return;

  const categorizedEvents = 
    sortCategorizedEvents(groupByPrimaryCategory(upcomingEvents));

  const eventsNavButton = document.querySelectorAll("a[href='/events']")[0].parentElement;
  const eventsMobileNavButton = document.querySelectorAll("a[href='/events']")[2].parentElement;
  eventsNavButton.replaceWith(createEventsNav(categorizedEvents));
  eventsMobileNavButton.replaceWith(createMobileEventsNav(categorizedEvents));

  console.info("Events Nav Mod Initialized!");
}

function createEventsNav(categorizedEvents) {
  const topLevelNavFolder = createElementFromHtml(baseEventsNavHtml);
  const contentFolder = topLevelNavFolder.querySelector("#events");

  let template = `
    <div class="header-nav-folder-item">
      <a href="{href}">
        <span class="header-nav-folder-item-content">
          {title}
        </span>
      </a>
    </div>
  `;

  for (const [category, events] of Object.entries(categorizedEvents)) {
    appendEventsByCategory(category, events, contentFolder, template)
  }
  appendBottomLinks(contentFolder, template);

  console.info("Desktop Nav Injected!")
  return topLevelNavFolder;
}

function createMobileEventsNav(categorizedEvents) {
  const topLevelNavFolder = createElementFromHtml(baseMobileEventsNavHtml);

  createMobileNavDataFolder(categorizedEvents);

  return topLevelNavFolder;
}

function createMobileNavDataFolder(categorizedEvents) {
  const moblieNav = document.querySelector("nav[class='header-menu-nav-list']")
  const eventsFolderElement = createElementFromHtml(baseMobileEventsDataFolderHtml);
  const eventsFolderContent = eventsFolderElement.querySelector("#mobile-events");

  let template = `
    <div class="container header-menu-nav-item">
      <a href="{href}" tabindex="0">
        <div class="header-menu-nav-item-content">
          {title}
        </div>
      </a>
    </div>
  `;

  for (const [category, events] of Object.entries(categorizedEvents)) {
    appendEventsByCategory(category, events, eventsFolderContent, template)
  }
  appendBottomLinks(eventsFolderContent, template);

  moblieNav.appendChild(eventsFolderElement);
  console.info("Mobile Nav Injected!")
}


function appendEventsByCategory(category, events, content, template) {
  if (category == "uncategorized") {
    category = "Other"
  }
  let headerTemplate = `
    <div class="header-nav-folder-item header-nav-folder-item--external">
      <a href="/#navheading" target="_blank">{title}</a>
    </div>
  `;

  headerTemplate = headerTemplate
    .replace("{title}", formatCategoryTitle(category));

  content.append(createElementFromHtml(headerTemplate));
  events.forEach((event) => {
    content.append(createEventNavItem(event, template));
  });
}

function appendBottomLinks(content, template) {
  const seeAllEventsElement = template
    .replace("{title}", "All upcoming events")
    .replace("{href}", "/events");
  content.append(createElementFromHtml(seeAllEventsElement));

  const previousEventsElement = template
    .replace("{title}", "Past Events")
    .replace("{href}", "/archive/events")
  content.append(createElementFromHtml(previousEventsElement));
}

// UTILS

function createEventNavItem(event, template) {

  template = template
    .replace("{title}", event.title)
    .replace("{href}", event.fullUrl);

  return createElementFromHtml(template)
}

function sortCategorizedEvents(events) {
  const ordered = Object.keys(events).sort(customSortCategories).reduce(
    (obj, key) => {
      obj[key] = events[key];
      return obj;
    },
    {}
  );
  return ordered;
}

function customSortCategories(category_a, category_b) {
  if (category_a === "uncategorized" && category_b === "uncategorized") {
    return 0;
  }
  if (category_b === "uncategorized"
    || (category_a.toLowerCase() < category_b.toLowerCase())) {
    return -1;
  }
  if (category_a === "uncategorized"
    || (category_a.toLowerCase() > category_b.toLowerCase())) {
    return 1;
  }

  return 0;
}

async function getEventPageData() {
  const baseUrl = window.location.origin;
  const dataUrl = baseUrl + '/events/?view=list&format=json';

  try {
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error("Events Fetch Response Status: " + response.status);
    }
    const result = await response.json();
    return result;
  }
  catch (error) {
    console.error(error.message);
  }
}


function createElementFromHtml(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild;
}

function groupByPrimaryCategory(events) {
  return events.reduce((group, event) => {
    const { categories } = event;
    let primaryCategory = categories[0];

    if (!primaryCategory) {
      primaryCategory = "uncategorized"
    }

    // Initialize the group if it doesn't exist
    if (!group[primaryCategory]) {
      group[primaryCategory] = [];
    }

    // Add the event to the corresponding event category group
    group[primaryCategory].push(event);
    return group;
  }, {});

}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

function formatCategoryTitle(title) {
  return toTitleCase(title.trim());
}

updateEventsNav();
