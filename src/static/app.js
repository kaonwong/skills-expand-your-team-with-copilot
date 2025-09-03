document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const registrationModal = document.getElementById("registration-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const signupForm = document.getElementById("signup-form");
  const activityInput = document.getElementById("activity");
  const closeRegistrationModal = document.querySelector(".close-modal");

  // Search and filter elements
  const searchInput = document.getElementById("activity-search");
  const searchButton = document.getElementById("search-button");
  const categoryFilters = document.querySelectorAll(".category-filter");
  const dayFilters = document.querySelectorAll(".day-filter");
  const timeFilters = document.querySelectorAll(".time-filter");
  
  // Mode toggle elements
  const filterModeBtn = document.getElementById("filter-mode");
  const groupModeBtn = document.getElementById("group-mode");
  const modeButtons = document.querySelectorAll(".mode-button");

  // Authentication elements
  const loginButton = document.getElementById("login-button");
  const userInfo = document.getElementById("user-info");
  const displayName = document.getElementById("display-name");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeLoginModal = document.querySelector(".close-login-modal");
  const loginMessage = document.getElementById("login-message");

  // Theme toggle elements
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.querySelector(".theme-icon");

  // View toggle elements
  const cardViewBtn = document.getElementById("card-view-btn");
  const calendarViewBtn = document.getElementById("calendar-view-btn");
  const calendarView = document.getElementById("calendar-view");
  const calendarBody = document.getElementById("calendar-body");

  // Activity categories with corresponding colors
  const activityTypes = {
    sports: { label: "Sports", color: "#e8f5e9", textColor: "#2e7d32" },
    arts: { label: "Arts", color: "#f3e5f5", textColor: "#7b1fa2" },
    academic: { label: "Academic", color: "#e3f2fd", textColor: "#1565c0" },
    community: { label: "Community", color: "#fff3e0", textColor: "#e65100" },
    technology: { label: "Technology", color: "#e8eaf6", textColor: "#3949ab" },
  };

  // State for activities and filters
  let allActivities = {};
  let currentFilter = "all";
  let searchQuery = "";
  let currentDay = "";
  let currentTimeRange = "";
  let currentView = "card"; // Track current view mode
  let currentMode = "filter"; // Track current mode: "filter" or "group"

  // Authentication state
  let currentUser = null;

  // Time range mappings for the dropdown
  const timeRanges = {
    morning: { start: "06:00", end: "08:00" }, // Before school hours
    afternoon: { start: "15:00", end: "18:00" }, // After school hours
    weekend: { days: ["Saturday", "Sunday"] }, // Weekend days
  };

  // Initialize filters from active elements
  function initializeFilters() {
    // Initialize day filter
    const activeDayFilter = document.querySelector(".day-filter.active");
    if (activeDayFilter) {
      currentDay = activeDayFilter.dataset.day;
    }

    // Initialize time filter
    const activeTimeFilter = document.querySelector(".time-filter.active");
    if (activeTimeFilter) {
      currentTimeRange = activeTimeFilter.dataset.time;
    }
  }

  // Function to set day filter
  function setDayFilter(day) {
    currentDay = day;

    // Update active class
    dayFilters.forEach((btn) => {
      if (btn.dataset.day === day) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Function to set time range filter
  function setTimeRangeFilter(timeRange) {
    currentTimeRange = timeRange;

    // Update active class
    timeFilters.forEach((btn) => {
      if (btn.dataset.time === timeRange) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Check if user is already logged in (from localStorage)
  function checkAuthentication() {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        // Verify the stored user with the server
        validateUserSession(currentUser.username);
      } catch (error) {
        console.error("Error parsing saved user", error);
        logout(); // Clear invalid data
      }
    }

    // Set authentication class on body
    updateAuthBodyClass();
  }

  // Validate user session with the server
  async function validateUserSession(username) {
    try {
      const response = await fetch(
        `/auth/check-session?username=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        // Session invalid, log out
        logout();
        return;
      }

      // Session is valid, update user data
      const userData = await response.json();
      currentUser = userData;
      localStorage.setItem("currentUser", JSON.stringify(userData));
      updateAuthUI();
    } catch (error) {
      console.error("Error validating session:", error);
    }
  }

  // Update UI based on authentication state
  function updateAuthUI() {
    if (currentUser) {
      loginButton.classList.add("hidden");
      userInfo.classList.remove("hidden");
      displayName.textContent = currentUser.display_name;
    } else {
      loginButton.classList.remove("hidden");
      userInfo.classList.add("hidden");
      displayName.textContent = "";
    }

    updateAuthBodyClass();
    // Refresh the activities to update the UI
    fetchActivities();
  }

  // Update body class for CSS targeting
  function updateAuthBodyClass() {
    if (currentUser) {
      document.body.classList.remove("not-authenticated");
    } else {
      document.body.classList.add("not-authenticated");
    }
  }

  // Login function
  async function login(username, password) {
    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showLoginMessage(
          data.detail || "Invalid username or password",
          "error"
        );
        return false;
      }

      // Login successful
      currentUser = data;
      localStorage.setItem("currentUser", JSON.stringify(data));
      updateAuthUI();
      closeLoginModalHandler();
      showMessage(`Welcome, ${currentUser.display_name}!`, "success");
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      showLoginMessage("Login failed. Please try again.", "error");
      return false;
    }
  }

  // Logout function
  function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    updateAuthUI();
    showMessage("You have been logged out.", "info");
  }

  // Show message in login modal
  function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
    loginMessage.classList.remove("hidden");
  }

  // Open login modal
  function openLoginModal() {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
    loginMessage.classList.add("hidden");
    loginForm.reset();
  }

  // Close login modal
  function closeLoginModalHandler() {
    loginModal.classList.remove("show");
    setTimeout(() => {
      loginModal.classList.add("hidden");
      loginForm.reset();
    }, 300);
  }

  // Theme toggle functionality
  function toggleTheme() {
    const isDarkMode = document.body.classList.contains("dark-theme");
    
    if (isDarkMode) {
      // Switch to light mode
      document.body.classList.remove("dark-theme");
      themeIcon.textContent = "🌙";
      themeToggle.title = "Switch to dark mode";
      localStorage.setItem("theme", "light");
    } else {
      // Switch to dark mode
      document.body.classList.add("dark-theme");
      themeIcon.textContent = "☀️";
      themeToggle.title = "Switch to light mode";
      localStorage.setItem("theme", "dark");
    }
  }

  // Initialize theme from localStorage
  function initializeTheme() {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Use saved theme, or default to system preference
    const shouldUseDarkMode = savedTheme === "dark" || (savedTheme === null && prefersDark);
    
    if (shouldUseDarkMode) {
      document.body.classList.add("dark-theme");
      themeIcon.textContent = "☀️";
      themeToggle.title = "Switch to light mode";
    } else {
      document.body.classList.remove("dark-theme");
      themeIcon.textContent = "🌙";
      themeToggle.title = "Switch to dark mode";
    }
  }

  // Event listeners for authentication
  loginButton.addEventListener("click", openLoginModal);
  logoutButton.addEventListener("click", logout);
  closeLoginModal.addEventListener("click", closeLoginModalHandler);

  // Theme toggle event listener
  themeToggle.addEventListener("click", toggleTheme);

  // Close login modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModalHandler();
    }
  });

  // Handle login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password);
  });

  // Show loading skeletons
  function showLoadingSkeletons() {
    activitiesList.innerHTML = "";

    // Create more skeleton cards to fill the screen since they're smaller now
    for (let i = 0; i < 9; i++) {
      const skeletonCard = document.createElement("div");
      skeletonCard.className = "skeleton-card";
      skeletonCard.innerHTML = `
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div style="margin-top: 8px;">
          <div class="skeleton-line" style="height: 6px;"></div>
          <div class="skeleton-line skeleton-text short" style="height: 8px; margin-top: 3px;"></div>
        </div>
        <div style="margin-top: auto;">
          <div class="skeleton-line" style="height: 24px; margin-top: 8px;"></div>
        </div>
      `;
      activitiesList.appendChild(skeletonCard);
    }
  }

  // Format schedule for display - handles both old and new format
  function formatSchedule(details) {
    // If schedule_details is available, use the structured data
    if (details.schedule_details) {
      const days = details.schedule_details.days.join(", ");

      // Convert 24h time format to 12h AM/PM format for display
      const formatTime = (time24) => {
        const [hours, minutes] = time24.split(":").map((num) => parseInt(num));
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${displayHours}:${minutes
          .toString()
          .padStart(2, "0")} ${period}`;
      };

      const startTime = formatTime(details.schedule_details.start_time);
      const endTime = formatTime(details.schedule_details.end_time);

      return `${days}, ${startTime} - ${endTime}`;
    }

    // Fallback to the string format if schedule_details isn't available
    return details.schedule;
  }

  // Function to determine activity type (this would ideally come from backend)
  function getActivityType(activityName, description) {
    const name = activityName.toLowerCase();
    const desc = description.toLowerCase();

    if (
      name.includes("soccer") ||
      name.includes("basketball") ||
      name.includes("sport") ||
      name.includes("fitness") ||
      desc.includes("team") ||
      desc.includes("game") ||
      desc.includes("athletic")
    ) {
      return "sports";
    } else if (
      name.includes("art") ||
      name.includes("music") ||
      name.includes("theater") ||
      name.includes("drama") ||
      name.includes("manga") ||
      desc.includes("creative") ||
      desc.includes("paint") ||
      desc.includes("graphic novels") ||
      desc.includes("stories")
    ) {
      return "arts";
    } else if (
      name.includes("science") ||
      name.includes("math") ||
      name.includes("academic") ||
      name.includes("study") ||
      name.includes("olympiad") ||
      desc.includes("learning") ||
      desc.includes("education") ||
      desc.includes("competition")
    ) {
      return "academic";
    } else if (
      name.includes("volunteer") ||
      name.includes("community") ||
      desc.includes("service") ||
      desc.includes("volunteer")
    ) {
      return "community";
    } else if (
      name.includes("computer") ||
      name.includes("coding") ||
      name.includes("tech") ||
      name.includes("robotics") ||
      desc.includes("programming") ||
      desc.includes("technology") ||
      desc.includes("digital") ||
      desc.includes("robot")
    ) {
      return "technology";
    }

    // Default to "academic" if no match
    return "academic";
  }

  // Function to fetch activities from API with optional day and time filters
  async function fetchActivities() {
    // Show loading skeletons first
    showLoadingSkeletons();

    try {
      // Build query string with filters if they exist
      let queryParams = [];

      // Handle day filter
      if (currentDay) {
        queryParams.push(`day=${encodeURIComponent(currentDay)}`);
      }

      // Handle time range filter
      if (currentTimeRange) {
        const range = timeRanges[currentTimeRange];

        // Handle weekend special case
        if (currentTimeRange === "weekend") {
          // Don't add time parameters for weekend filter
          // Weekend filtering will be handled on the client side
        } else if (range) {
          // Add time parameters for before/after school
          queryParams.push(`start_time=${encodeURIComponent(range.start)}`);
          queryParams.push(`end_time=${encodeURIComponent(range.end)}`);
        }
      }

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`/activities${queryString}`);
      const activities = await response.json();

      // Save the activities data
      allActivities = activities;

      // Apply search and filter, and handle weekend filter in client
      displayFilteredActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to display filtered activities
  function displayFilteredActivities() {
    // Clear both views
    activitiesList.innerHTML = "";
    if (calendarBody) {
      calendarBody.innerHTML = "";
    }

    // Apply client-side filtering - this handles category filter and search, plus weekend filter
    let filteredActivities = {};

    Object.entries(allActivities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);

      // Apply category filter (only in filter mode, not group mode)
      if (currentMode === "filter" && currentFilter !== "all" && activityType !== currentFilter) {
        return;
      }

      // Apply weekend filter if selected
      if (currentTimeRange === "weekend" && details.schedule_details) {
        const activityDays = details.schedule_details.days;
        const isWeekendActivity = activityDays.some((day) =>
          timeRanges.weekend.days.includes(day)
        );

        if (!isWeekendActivity) {
          return;
        }
      }

      // Apply search filter
      const searchableContent = [
        name.toLowerCase(),
        details.description.toLowerCase(),
        formatSchedule(details).toLowerCase(),
      ].join(" ");

      if (
        searchQuery &&
        !searchableContent.includes(searchQuery.toLowerCase())
      ) {
        return;
      }

      // Activity passed all filters, add to filtered list
      filteredActivities[name] = details;
    });

    // Check if there are any results
    if (Object.keys(filteredActivities).length === 0) {
      const noResultsHtml = `
        <div class="no-results">
          <h4>No activities found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
      
      if (currentView === "card") {
        activitiesList.innerHTML = noResultsHtml;
      } else {
        calendarBody.innerHTML = noResultsHtml;
      }
      return;
    }

    // Display filtered activities based on current view and mode
    if (currentView === "card") {
      if (currentMode === "group") {
        renderGroupedActivities(filteredActivities);
      } else {
        Object.entries(filteredActivities).forEach(([name, details]) => {
          renderActivityCard(name, details);
        });
      }
    } else {
      renderCalendarView(filteredActivities);
    }
  }

  // Function to render activities grouped by category
  function renderGroupedActivities(filteredActivities) {
    // Group activities by category
    const groupedActivities = {};
    
    Object.entries(filteredActivities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);
      if (!groupedActivities[activityType]) {
        groupedActivities[activityType] = [];
      }
      groupedActivities[activityType].push({ name, details });
    });

    // Only show groups that have activities and respect category filter in group mode
    const categoriesToShow = Object.keys(groupedActivities).filter(category => {
      // If a specific category is selected, only show that category
      if (currentFilter !== "all") {
        return category === currentFilter;
      }
      return true;
    });

    // Sort categories in a logical order
    const categoryOrder = ["sports", "arts", "academic", "community", "technology"];
    categoriesToShow.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      return indexA - indexB;
    });

    // Render each category group
    categoriesToShow.forEach(category => {
      const activities = groupedActivities[category];
      if (activities && activities.length > 0) {
        const categoryInfo = activityTypes[category];
        
        // Create group container
        const groupDiv = document.createElement("div");
        groupDiv.className = "category-group";
        
        // Create group header
        const headerDiv = document.createElement("div");
        headerDiv.className = "category-group-header";
        headerDiv.style.backgroundColor = categoryInfo.textColor;
        headerDiv.innerHTML = `
          <span class="group-icon">${getCategoryIcon(category)}</span>
          <span>${categoryInfo.label} (${activities.length})</span>
        `;
        
        // Create activities container
        const activitiesDiv = document.createElement("div");
        activitiesDiv.className = "category-group-activities";
        
        // Render activities in this group
        activities.forEach(({ name, details }) => {
          const activityCard = createActivityCardElement(name, details);
          activitiesDiv.appendChild(activityCard);
        });
        
        groupDiv.appendChild(headerDiv);
        groupDiv.appendChild(activitiesDiv);
        activitiesList.appendChild(groupDiv);
      }
    });

    // If no groups to show, display appropriate message
    if (categoriesToShow.length === 0) {
      activitiesList.innerHTML = `
        <div class="no-results">
          <h4>No activities found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
    }
  }

  // Helper function to get category icon
  function getCategoryIcon(category) {
    const icons = {
      sports: "🏃",
      arts: "🎨",
      academic: "📚",
      community: "🤝",
      technology: "💻"
    };
    return icons[category] || "📝";
  }

  // Helper function to create activity card element (extracted from existing renderActivityCard)
  function createActivityCardElement(name, details) {
    const activityType = getActivityType(name, details.description);
    const enrollment = `${details.participants.length}/${details.max_participants}`;
    const availableSpots = details.max_participants - details.participants.length;
    
    const card = document.createElement("div");
    card.className = "activity-card";
    
    card.innerHTML = `
      <div class="activity-category ${activityType}">${activityTypes[activityType].label}</div>
      <h4>${name}</h4>
      <p class="activity-description">${details.description}</p>
      <p class="activity-schedule">
        <strong>Schedule:</strong> ${formatSchedule(details)}
      </p>
      <div class="capacity-info">
        <div class="capacity-bar">
          <div class="capacity-bar-fill" style="width: ${(details.participants.length / details.max_participants) * 100}%"></div>
        </div>
        <div class="capacity-text">
          <span>${enrollment}</span>
          <span>${availableSpots} spots left</span>
        </div>
      </div>
      ${details.participants.length > 0 ? `
        <div class="participants-list">
          <h5>Current Participants:</h5>
          <ul>
            ${details.participants.map(participant => `<li>${participant}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      <div class="registration-info">
        ${currentUser ? 
          `<button class="register-btn" onclick="openRegistrationModal('${name}')">Register Student</button>` : 
          'Teachers can register students.'
        }
      </div>
    `;
    
    return card;
  }

  // Function to update view toggle buttons
  function updateViewToggle() {
    // Update button active states
    cardViewBtn.classList.toggle("active", currentView === "card");
    calendarViewBtn.classList.toggle("active", currentView === "calendar");
    
    // Show/hide appropriate views
    if (currentView === "card") {
      activitiesList.classList.remove("hidden");
      calendarView.classList.add("hidden");
    } else {
      activitiesList.classList.add("hidden");
      calendarView.classList.remove("hidden");
    }
  }

  // Function to render calendar view
  function renderCalendarView(filteredActivities) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const timeSlots = generateTimeSlots();
    
    // Create calendar grid
    let calendarHtml = "";
    
    // Generate time slots
    timeSlots.forEach(timeSlot => {
      calendarHtml += `<div class="time-slot">`;
      calendarHtml += `<div class="time-label">${timeSlot.display}</div>`;
      
      days.forEach(day => {
        const activitiesInSlot = getActivitiesForDayAndTime(filteredActivities, day, timeSlot);
        const cellClass = activitiesInSlot.length > 1 ? 
          (activitiesInSlot.length > 2 ? "day-cell has-triple" : "day-cell has-multiple") : 
          "day-cell";
        
        calendarHtml += `<div class="${cellClass}">`;
        activitiesInSlot.forEach(activity => {
          const activityType = getActivityType(activity.name, activity.details.description);
          const enrollment = `${activity.details.participants.length}/${activity.details.max_participants}`;
          
          calendarHtml += `
            <div class="calendar-activity ${activityType}" 
                 data-activity-name="${activity.name}"
                 data-activity-details='${JSON.stringify(activity.details)}'>
              <div class="activity-name">${activity.name}</div>
              <div class="activity-enrollment">${enrollment}</div>
            </div>
          `;
        });
        calendarHtml += `</div>`;
      });
      
      calendarHtml += `</div>`;
    });
    
    calendarBody.innerHTML = calendarHtml;
    
    // Add hover event listeners for tooltips
    addCalendarTooltips();
  }

  // Function to generate time slots for calendar
  function generateTimeSlots() {
    const slots = [];
    
    // Early morning slots (6:00 AM - 8:00 AM)
    for (let hour = 6; hour < 8; hour++) {
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`,
        display: formatTimeDisplay(`${hour.toString().padStart(2, '0')}:00`)
      });
    }
    
    // Afternoon slots (3:00 PM - 6:00 PM)
    for (let hour = 15; hour < 18; hour++) {
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`,
        display: formatTimeDisplay(`${hour.toString().padStart(2, '0')}:00`)
      });
    }
    
    // Weekend slots (10:00 AM - 6:00 PM)
    for (let hour = 10; hour < 18; hour++) {
      if (hour < 15 || hour >= 18) { // Don't duplicate afternoon slots
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        if (!slots.some(slot => slot.start === timeStr)) {
          slots.push({
            start: timeStr,
            end: `${(hour + 1).toString().padStart(2, '0')}:00`,
            display: formatTimeDisplay(timeStr)
          });
        }
      }
    }
    
    // Evening slots (7:00 PM - 9:00 PM) for evening activities
    for (let hour = 19; hour < 21; hour++) {
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`,
        display: formatTimeDisplay(`${hour.toString().padStart(2, '0')}:00`)
      });
    }
    
    return slots.sort((a, b) => a.start.localeCompare(b.start));
  }

  // Function to format time for display
  function formatTimeDisplay(time24) {
    const [hours, minutes] = time24.split(":").map(num => parseInt(num));
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Function to get activities for a specific day and time slot
  function getActivitiesForDayAndTime(activities, day, timeSlot) {
    const result = [];
    
    Object.entries(activities).forEach(([name, details]) => {
      if (!details.schedule_details) return;
      
      const activityDays = details.schedule_details.days;
      const activityStart = details.schedule_details.start_time;
      const activityEnd = details.schedule_details.end_time;
      
      // Check if activity is on this day
      if (activityDays.includes(day)) {
        // Check if activity time overlaps with time slot
        if (timeOverlaps(activityStart, activityEnd, timeSlot.start, timeSlot.end)) {
          result.push({ name, details });
        }
      }
    });
    
    return result;
  }

  // Function to check if two time ranges overlap
  function timeOverlaps(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2;
  }

  // Function to add tooltip functionality to calendar activities
  function addCalendarTooltips() {
    const calendarActivities = document.querySelectorAll('.calendar-activity');
    let tooltip = null;
    
    calendarActivities.forEach(activity => {
      activity.addEventListener('mouseenter', (e) => {
        const activityName = e.target.dataset.activityName;
        const activityDetails = JSON.parse(e.target.dataset.activityDetails);
        
        // Create tooltip
        tooltip = document.createElement('div');
        tooltip.className = 'calendar-tooltip show';
        tooltip.innerHTML = `
          <div class="tooltip-title">${activityName}</div>
          <div class="tooltip-description">${activityDetails.description}</div>
          <div class="tooltip-schedule"><strong>Schedule:</strong> ${formatSchedule(activityDetails)}</div>
          <div class="tooltip-enrollment">
            <strong>Enrollment:</strong> ${activityDetails.participants.length}/${activityDetails.max_participants}
          </div>
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX}px`;
        tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        
        // Adjust if tooltip goes off screen
        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
          tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
        }
        if (tooltipRect.bottom > window.innerHeight) {
          tooltip.style.top = `${rect.top + window.scrollY - tooltipRect.height - 5}px`;
        }
      });
      
      activity.addEventListener('mouseleave', () => {
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
        }
      });
    });
  }

  // Function to render a single activity card
  function renderActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    // Calculate spots and capacity
    const totalSpots = details.max_participants;
    const takenSpots = details.participants.length;
    const spotsLeft = totalSpots - takenSpots;
    const capacityPercentage = (takenSpots / totalSpots) * 100;
    const isFull = spotsLeft <= 0;

    // Determine capacity status class
    let capacityStatusClass = "capacity-available";
    if (isFull) {
      capacityStatusClass = "capacity-full";
    } else if (capacityPercentage >= 75) {
      capacityStatusClass = "capacity-near-full";
    }

    // Determine activity type
    const activityType = getActivityType(name, details.description);
    const typeInfo = activityTypes[activityType];

    // Format the schedule using the new helper function
    const formattedSchedule = formatSchedule(details);

    // Create activity tag
    const tagHtml = `
      <span class="activity-tag" style="background-color: ${typeInfo.color}; color: ${typeInfo.textColor}">
        ${typeInfo.label}
      </span>
    `;

    // Create capacity indicator
    const capacityIndicator = `
      <div class="capacity-container ${capacityStatusClass}">
        <div class="capacity-bar-bg">
          <div class="capacity-bar-fill" style="width: ${capacityPercentage}%"></div>
        </div>
        <div class="capacity-text">
          <span>${takenSpots} enrolled</span>
          <span>${spotsLeft} spots left</span>
        </div>
      </div>
    `;

    activityCard.innerHTML = `
      ${tagHtml}
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p class="tooltip">
        <strong>Schedule:</strong> ${formattedSchedule}
        <span class="tooltip-text">Regular meetings at this time throughout the semester</span>
      </p>
      ${capacityIndicator}
      <div class="participants-list">
        <h5>Current Participants:</h5>
        <ul>
          ${details.participants
            .map(
              (email) => `
            <li>
              ${email}
              ${
                currentUser
                  ? `
                <span class="delete-participant tooltip" data-activity="${name}" data-email="${email}">
                  ✖
                  <span class="tooltip-text">Unregister this student</span>
                </span>
              `
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
      <div class="activity-card-actions">
        ${
          currentUser
            ? `
          <button class="register-button" data-activity="${name}" ${
                isFull ? "disabled" : ""
              }>
            ${isFull ? "Activity Full" : "Register Student"}
          </button>
        `
            : `
          <div class="auth-notice">
            Teachers can register students.
          </div>
        `
        }
      </div>
    `;

    // Add click handlers for delete buttons
    const deleteButtons = activityCard.querySelectorAll(".delete-participant");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    // Add click handler for register button (only when authenticated)
    if (currentUser) {
      const registerButton = activityCard.querySelector(".register-button");
      if (!isFull) {
        registerButton.addEventListener("click", () => {
          openRegistrationModal(name);
        });
      }
    }

    activitiesList.appendChild(activityCard);
  }

  // Event listeners for search and filter
  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    displayFilteredActivities();
  });

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    searchQuery = searchInput.value;
    displayFilteredActivities();
  });

  // Add event listeners to category filter buttons
  categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      categoryFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current filter and display filtered activities
      currentFilter = button.dataset.category;
      displayFilteredActivities();
    });
  });

  // Add event listeners to mode toggle buttons
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      modeButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current mode and display activities
      currentMode = button.dataset.mode;
      displayFilteredActivities();
    });
  });

  // Add event listeners to day filter buttons
  dayFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      dayFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current day filter and fetch activities
      currentDay = button.dataset.day;
      fetchActivities();
    });
  });

  // Add event listeners for time filter buttons
  timeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      timeFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current time filter and fetch activities
      currentTimeRange = button.dataset.time;
      fetchActivities();
    });
  });

  // Add event listeners for view toggle buttons
  cardViewBtn.addEventListener("click", () => {
    if (currentView !== "card") {
      currentView = "card";
      updateViewToggle();
      displayFilteredActivities();
    }
  });

  calendarViewBtn.addEventListener("click", () => {
    if (currentView !== "calendar") {
      currentView = "calendar";
      updateViewToggle();
      displayFilteredActivities();
    }
  });

  // Open registration modal
  function openRegistrationModal(activityName) {
    modalActivityName.textContent = activityName;
    activityInput.value = activityName;
    registrationModal.classList.remove("hidden");
    // Add slight delay to trigger animation
    setTimeout(() => {
      registrationModal.classList.add("show");
    }, 10);
  }

  // Close registration modal
  function closeRegistrationModalHandler() {
    registrationModal.classList.remove("show");
    setTimeout(() => {
      registrationModal.classList.add("hidden");
      signupForm.reset();
    }, 300);
  }

  // Event listener for close button
  closeRegistrationModal.addEventListener(
    "click",
    closeRegistrationModalHandler
  );

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === registrationModal) {
      closeRegistrationModalHandler();
    }
  });

  // Create and show confirmation dialog
  function showConfirmationDialog(message, confirmCallback) {
    // Create the confirmation dialog if it doesn't exist
    let confirmDialog = document.getElementById("confirm-dialog");
    if (!confirmDialog) {
      confirmDialog = document.createElement("div");
      confirmDialog.id = "confirm-dialog";
      confirmDialog.className = "modal hidden";
      confirmDialog.innerHTML = `
        <div class="modal-content">
          <h3>Confirm Action</h3>
          <p id="confirm-message"></p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="cancel-button" class="cancel-btn">Cancel</button>
            <button id="confirm-button" class="confirm-btn">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);

      // Style the buttons
      const cancelBtn = confirmDialog.querySelector("#cancel-button");
      const confirmBtn = confirmDialog.querySelector("#confirm-button");

      cancelBtn.style.backgroundColor = "#f1f1f1";
      cancelBtn.style.color = "#333";

      confirmBtn.style.backgroundColor = "#dc3545";
      confirmBtn.style.color = "white";
    }

    // Set the message
    const confirmMessage = document.getElementById("confirm-message");
    confirmMessage.textContent = message;

    // Show the dialog
    confirmDialog.classList.remove("hidden");
    setTimeout(() => {
      confirmDialog.classList.add("show");
    }, 10);

    // Handle button clicks
    const cancelButton = document.getElementById("cancel-button");
    const confirmButton = document.getElementById("confirm-button");

    // Remove any existing event listeners
    const newCancelButton = cancelButton.cloneNode(true);
    const newConfirmButton = confirmButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    // Add new event listeners
    newCancelButton.addEventListener("click", () => {
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    newConfirmButton.addEventListener("click", () => {
      confirmCallback();
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    // Close when clicking outside
    confirmDialog.addEventListener("click", (event) => {
      if (event.target === confirmDialog) {
        confirmDialog.classList.remove("show");
        setTimeout(() => {
          confirmDialog.classList.add("hidden");
        }, 300);
      }
    });
  }

  // Handle unregistration with confirmation
  async function handleUnregister(event) {
    // Check if user is authenticated
    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to unregister students.",
        "error"
      );
      return;
    }

    const activity = event.target.dataset.activity;
    const email = event.target.dataset.email;

    // Show confirmation dialog
    showConfirmationDialog(
      `Are you sure you want to unregister ${email} from ${activity}?`,
      async () => {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(
              activity
            )}/unregister?email=${encodeURIComponent(
              email
            )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
            {
              method: "POST",
            }
          );

          const result = await response.json();

          if (response.ok) {
            showMessage(result.message, "success");
            // Refresh the activities list
            fetchActivities();
          } else {
            showMessage(result.detail || "An error occurred", "error");
          }
        } catch (error) {
          showMessage("Failed to unregister. Please try again.", "error");
          console.error("Error unregistering:", error);
        }
      }
    );
  }

  // Show message function
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Check if user is authenticated
    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to register students.",
        "error"
      );
      return;
    }

    const email = document.getElementById("email").value;
    const activity = activityInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(
          email
        )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        closeRegistrationModalHandler();
        // Refresh the activities list after successful signup
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Expose filter functions to window for future UI control
  window.activityFilters = {
    setDayFilter,
    setTimeRangeFilter,
  };

  // Initialize app
  initializeTheme();
  checkAuthentication();
  initializeFilters();
  updateViewToggle(); // Initialize view toggle state
  fetchActivities();
});
