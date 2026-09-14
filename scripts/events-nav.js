const baseEventsNavHtml = `
  <div class="header-nav-item header-nav-item--folder">
    <button class="header-nav-folder-title" data-href="/events" data-animation-role="header-element" aria-expanded="false" aria-controls="events">
      <span class="header-nav-folder-title-text">Events</span>
    </button>
    <div class="header-nav-folder-content" id="events"></div>
  </div>
`;

async function updateEventsNav() {
  const eventPageData = await getEventPageData();
  const upcomingEvents = eventPageData
    .upcoming
    .filter((event) => event.starred);

  if (!upcomingEvents || upcomingEvents.length === 0)
    return;

  const eventsNavButton = document.querySelector("a[href='/events']").parentElement;
  eventsNavButton.replaceWith(createEventsNav(upcomingEvents));
}

function createEventsNav(events) {
  const topLevelNavFolder = createElementFromHtml(baseEventsNavHtml);
  const contentFolder = topLevelNavFolder.querySelector("#events");
  const categorizedEvents = sortCategorizedEvents(groupByPrimaryCategory(events));

  for (const [category, events] of Object.entries(categorizedEvents)) {
    appendEventsByCategory(category, events, contentFolder)
  }
  appendBottomLinks(contentFolder);

  return topLevelNavFolder;
}

function appendEventsByCategory(category, events, content) {
  if (category == "uncategorized") {
    category = "Other"
  }

  let template = `
    <div class="header-nav-folder-item header-nav-folder-item--external">
      <a href="/#navheading" target="_blank">{title}</a>
    </div>
  `;
  template = template
    .replace("{title}", formatCategoryTitle(category));

  content.append(createElementFromHtml(template));
  events.forEach((event) => {
    content.append(createEventNavItem(event));
  });
}

function appendBottomLinks(content) {
  let seeAllEventsElement = `
    <div class="header-nav-folder-item">
      <a href="/events">
        <span class="header-nav-folder-item-content">
          All upcoming events
        </span>
      </a>
    </div>
  `;
  content.append(createElementFromHtml(seeAllEventsElement));

  let previousEventsElement = `
    <div class="header-nav-folder-item">
      <a href="/archive/events">
        <span class="header-nav-folder-item-content">
          Past events
        </span>
      </a>
    </div>
  `;
  content.append(createElementFromHtml(previousEventsElement));
}

// UTILS

function createEventNavItem(event) {
  let template = `
    <div class="header-nav-folder-item">
      <a href="{href}">
        <span class="header-nav-folder-item-content">
          {title}
        </span>
      </a>
    </div>
  `;

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
