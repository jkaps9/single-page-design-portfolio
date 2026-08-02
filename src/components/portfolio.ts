const container = document.querySelector(".image-container");
const track = document.querySelector(".image-track");
const prevBtn = document.getElementById("left");
const nextBtn = document.getElementById("right");
const images = document.querySelectorAll(".image");

const liveAnnouncement = document.createElement("div");
liveAnnouncement.setAttribute("aria-live", "assertive");
liveAnnouncement.setAttribute("aria-atomic", "true");
liveAnnouncement.classList.add("sr-only"); // CSS class to visually hide the element
document.body.appendChild(liveAnnouncement);

// Initializing state variables
let currentIndex = images.length >= 3 ? 2 : 0;
let isDragging = false;
let startX = 0;
let currentTranslate = 0;
let prevTranslate = 0;

function updateAnnouncement() {
  if (images.length > 0) {
    const activeSlideNumber = currentIndex + 1;
    liveAnnouncement.textContent = `Slide ${activeSlideNumber} of ${images.length}`;
  }
}

function getGapAndWidth() {
  if (!track || images.length === 0) return { slideWidth: 0, gap: 0 };
  const slideWidth = images[0].getBoundingClientRect().width;
  const trackStyle = window.getComputedStyle(track);
  const gap = parseFloat(trackStyle.gap) || 0;
  return { slideWidth, gap };
}

function getPositionX(event: TouchEvent | MouseEvent) {
  return event.type.includes("touch")
    ? (event as TouchEvent).touches[0].clientX
    : (event as MouseEvent).clientX;
}

function updateSlider(withTransition = true) {
  const containerWidth = container
    ? container.getBoundingClientRect().width
    : 0;
  if (containerWidth === 0 || images.length === 0) return;

  const { slideWidth, gap } = getGapAndWidth();
  const screenCenter = containerWidth / 2;
  const activeSlideCenter =
    slideWidth * currentIndex + gap * currentIndex + slideWidth / 2;

  currentTranslate = -(activeSlideCenter - screenCenter);
  prevTranslate = currentTranslate;

  if (!withTransition) track.classList.add("no-transition");
  track.style.transform = `translateX(${currentTranslate}px)`;

  if (!withTransition) {
    track.offsetHeight; // Force reflow
    track.classList.remove("no-transition");
  }

  updateAnnouncement();
  // Lock navigation boundaries
  if (prevBtn) prevBtn.disabled = currentIndex === 0;
  if (nextBtn) nextBtn.disabled = currentIndex === images.length - 1;
}

// --- Button Navigation ---
nextBtn?.addEventListener("click", () => {
  if (currentIndex < images.length - 1) {
    currentIndex++;
    updateSlider(true);
  }
});

prevBtn?.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    updateSlider(true);
  }
});

// --- Keyboard Input Support ---
window.addEventListener("keydown", (e) => {
  // Only intercept if the user isn't typing in an input/textarea
  if (
    document.activeElement?.tagName === "INPUT" ||
    document.activeElement?.tagName === "TEXTAREA"
  )
    return;

  if (e.key === "ArrowRight" || e.key === "Right") {
    if (currentIndex < images.length - 1) {
      currentIndex++;
      updateSlider(true);
    }
  } else if (e.key === "ArrowLeft" || e.key === "Left") {
    if (currentIndex > 0) {
      currentIndex--;
      updateSlider(true);
    }
  }
});

// --- Swipe & Drag Functionality ---
function dragStart(event: TouchEvent | MouseEvent) {
  isDragging = true;
  startX = getPositionX(event);
  track.classList.add("no-transition");
}

function dragMove(event: TouchEvent | MouseEvent) {
  if (!isDragging) return;
  const currentX = getPositionX(event);
  const dragDistance = currentX - startX;

  // Shift track position 1:1 with the movement of user's cursor/finger
  const dragTranslate = prevTranslate + dragDistance;
  track.style.transform = `translateX(${dragTranslate}px)`;
}

function dragEnd(event: TouchEvent | MouseEvent) {
  if (!isDragging) return;
  isDragging = false;
  track.classList.remove("no-transition");

  // Track how far the user pulled the slide
  const endX = event.type.includes("touch")
    ? (event as TouchEvent).changedTouches[0].clientX
    : (event as MouseEvent).clientX;
  const dragDistance = endX - startX;

  const { slideWidth, gap } = getGapAndWidth();
  const swipeThreshold = (slideWidth + gap) * 0.2; // 20% swipe threshold to flip slides

  if (dragDistance < -swipeThreshold && currentIndex < images.length - 1) {
    currentIndex++; // Swiped left -> show next item
  } else if (dragDistance > swipeThreshold && currentIndex > 0) {
    currentIndex--; // Swiped right -> show previous item
  }

  updateSlider(true);
}

// Mouse Actions
if (container) container.addEventListener("mousedown", dragStart);

if (window) {
  window.addEventListener("mousemove", dragMove);
  window.addEventListener("mouseup", dragEnd);
}
// Touch Actions (Passive sets help prevent mobile performance scrolling lag)
if (container)
  container.addEventListener("touchstart", dragStart, { passive: true });
if (window) {
  window.addEventListener("touchmove", dragMove, { passive: true });
  window.addEventListener("touchend", dragEnd);

  // Handle Resize Window
  window.addEventListener("resize", () => updateSlider(false));
}
// Initial Run
updateSlider(false);
