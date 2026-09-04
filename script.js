/* =====================================================
CONFIGURATION
===================================================== */

const API_URL =
    "https://script.google.com/macros/s/AKfycby2t81mKpG48QIsBgnvSJnPoj1j1ABvu6QNNflWSU5S5JdHsRpVVHwqaIP6L83bitOLyQ/exec";


/* =====================================================
GLOBAL QUIZ STATE
===================================================== */

let currentQuizType = "vocab";

let currentQuiz = null;

let selectedAnswers = {};

let quizSubmitted = false;


/* =====================================================
DOM READY
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupNavigation();

        setupQuizTabs();

        setupCurrentAffairsControls();

        loadDailyLearning();


        /*
         * On every refresh:
         * Current Affairs always starts with Today's section.
         */

        localStorage.setItem(
            "currentAffairsMode",
            "today"
        );

        setCurrentAffairsButton(
            "today"
        );

        loadCurrentAffairs(
            "today"
        );


        /*
         * Check weekly quiz availability.
         */

        await checkWeeklyQuiz();


        /*
         * On refresh:
         * Do NOT restore previous page section.
         */

        resetPageToTop();


        /*
         * On refresh:
         * Do NOT restore previous quiz.
         */

        setActiveQuizTab(
            null
        );

        showQuizStartMessage();

        updateCurrentYear();

    }
);


/* =====================================================
REFRESH PAGE POSITION
===================================================== */

function resetPageToTop() {

    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto"
    });


    setTimeout(
        () => {

            window.scrollTo({
                top: 20,
                left: 0,
                behavior: "auto"
            });

        },
        0.1
    );


    setTimeout(
        () => {

            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "auto"
            });

        },
        0.1
    );

}


/* =====================================================
NAVIGATION
===================================================== */

function setupNavigation() {

    const menuBtn =
        document.getElementById(
            "menuBtn"
        );

    const navLinks =
        document.getElementById(
            "navLinks"
        );


    if (
        !menuBtn ||
        !navLinks
    ) {

        return;

    }


    menuBtn.addEventListener(
        "click",
        () => {

            navLinks.classList.toggle(
                "active"
            );

        }
    );


    navLinks
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        navLinks.classList.remove(
                            "active"
                        );


                        const href =
                            link.getAttribute(
                                "href"
                            );


                        /*
                         * Save only internal page sections.
                         */

                        if (
                            href &&
                            href.startsWith("#")
                        ) {

                            localStorage.setItem(
                                "lastSection",
                                href
                            );

                        }

                    }
                );

            }
        );

}


/* =====================================================
RESTORE LAST SECTION
===================================================== */

function restoreLastSection() {

    const savedSection =
        localStorage.getItem(
            "lastSection"
        );


    if (!savedSection) {

        return;

    }


    const target =
        document.querySelector(
            savedSection
        );


    if (!target) {

        return;

    }


    setTimeout(
        () => {

            target.scrollIntoView({
                behavior: "auto",
                block: "start"
            });

        },
        150
    );

}


/* =====================================================
CURRENT YEAR
===================================================== */

function updateCurrentYear() {

    const yearElement =
        document.getElementById(
            "currentYear"
        );


    if (yearElement) {

        yearElement.textContent =
            new Date().getFullYear();

    }

}


/* =====================================================
CURRENT AFFAIRS CONTROLS
===================================================== */

function setupCurrentAffairsControls() {

    const todayBtn =
        document.getElementById(
            "todayCaBtn"
        );


    const previousBtn =
        document.getElementById(
            "previousCaBtn"
        );


    if (todayBtn) {

        todayBtn.addEventListener(
            "click",
            () => {

                localStorage.setItem(
                    "currentAffairsMode",
                    "today"
                );


                setCurrentAffairsButton(
                    "today"
                );


                loadCurrentAffairs(
                    "today"
                );

            }
        );

    }


    if (previousBtn) {

        previousBtn.addEventListener(
            "click",
            () => {

                localStorage.setItem(
                    "currentAffairsMode",
                    "previous"
                );


                setCurrentAffairsButton(
                    "previous"
                );


                loadCurrentAffairs(
                    "previous"
                );

            }
        );

    }

}


/* =====================================================
SET CURRENT AFFAIRS BUTTON
===================================================== */

function setCurrentAffairsButton(
    type
) {

    const todayBtn =
        document.getElementById(
            "todayCaBtn"
        );


    const previousBtn =
        document.getElementById(
            "previousCaBtn"
        );


    if (todayBtn) {

        todayBtn.classList.toggle(
            "active",
            type === "today"
        );

    }


    if (previousBtn) {

        previousBtn.classList.toggle(
            "active",
            type === "previous"
        );

    }

}


/* =====================================================
LOAD CURRENT AFFAIRS
===================================================== */

async function loadCurrentAffairs(
    mode = "today"
) {

    const container =
        document.getElementById(
            "currentAffairsList"
        );


    const footerText =
        document.getElementById(
            "caFooterText"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        `<div class="loading">
            Loading current affairs...
        </div>`;


    try {

        const response =
            await fetch(
                `${API_URL}?type=current-affairs&mode=${encodeURIComponent(mode)}`,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load current affairs."
            );

        }


        const data =
            await response.json();


        if (
            !data.success ||
            !Array.isArray(
                data.current_affairs
            )
        ) {

            throw new Error(
                "Invalid current affairs response."
            );

        }


        if (
            data.current_affairs.length === 0
        ) {

            container.innerHTML =
                `<div class="loading">
                    No current affairs available.
                </div>`;

            return;

        }


        if (
            mode === "today"
        ) {

            displayCurrentAffairs(
                data.current_affairs,
                container,
                false
            );


            if (footerText) {

                footerText.textContent =
                    `Current Affairs for ${formatDate(
                        data.date
                    )}.`;

            }

        } else {

            displayPreviousCurrentAffairs(
                data.current_affairs,
                container
            );


            if (footerText) {

                footerText.textContent =
                    "Showing current affairs from the last 7 available days.";

            }

        }

    } catch (error) {

        console.error(
            "Current Affairs Error:",
            error
        );


        container.innerHTML =
            `<div class="loading">
                Unable to load current affairs.
                Please try again later.
            </div>`;

    }

}


/* =====================================================
DISPLAY TODAY'S CURRENT AFFAIRS
===================================================== */

function displayCurrentAffairs(
    affairs,
    container,
    grouped = false
) {

    container.innerHTML = "";


    affairs.forEach(
        (item, index) => {

            const article =
                createCurrentAffairElement(
                    item,
                    index + 1
                );


            container.appendChild(
                article
            );

        }
    );

}


/* =====================================================
DISPLAY PREVIOUS 7 DAYS
===================================================== */

function displayPreviousCurrentAffairs(
    affairs,
    container
) {

    container.innerHTML = "";


    const groups = {};


    affairs.forEach(
        item => {

            const date =
                item.date ||
                "Unknown Date";


            if (!groups[date]) {

                groups[date] = [];

            }


            groups[date].push(
                item
            );

        }
    );


    Object.keys(groups).forEach(
        date => {

            const heading =
                document.createElement(
                    "div"
                );


            heading.className =
                "ca_day_heading";


            heading.textContent =
                formatDate(
                    date
                );


            container.appendChild(
                heading
            );


            groups[date].forEach(
                (item, index) => {

                    const article =
                        createCurrentAffairElement(
                            item,
                            index + 1
                        );


                    container.appendChild(
                        article
                    );

                }
            );

        }
    );

}


/* =====================================================
CREATE CURRENT AFFAIR CARD
===================================================== */

function createCurrentAffairElement(
    item,
    serialNumber
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "current_affair";


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "ca_item_header";


    const serial =
        document.createElement(
            "span"
        );


    serial.className =
        "ca_serial";


    serial.textContent =
        serialNumber;


    header.appendChild(
        serial
    );


    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        item.title ||
        "Current Affair";


    header.appendChild(
        title
    );


    article.appendChild(
        header
    );


    const description =
        document.createElement(
            "p"
        );


    description.textContent =
        item.description ||
        "";


    article.appendChild(
        description
    );


    if (item.category) {

        const category =
            document.createElement(
                "span"
            );


        category.className =
            "ca_category";


        category.textContent =
            item.category;


        article.appendChild(
            category
        );

    }


    /*
     * Link is optional.
     *
     * SECURITY:
     * Only HTTP/HTTPS URLs are accepted.
     */

    const safeLink =
        safeURL(
            item.link
        );


    if (safeLink) {

        const link =
            document.createElement(
                "a"
            );


        link.className =
            "ca_link";


        link.href =
            safeLink;


        link.target =
            "_blank";


        link.rel =
            "noopener noreferrer";


        link.textContent =
            "🔗 Read More";


        article.appendChild(
            link
        );

    }


    return article;

}


/* =====================================================
SAFE URL
===================================================== */

function safeURL(value) {

    try {

        const url =
            new URL(
                String(
                    value || ""
                ).trim()
            );


        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {

            return "";

        }


        return url.href;

    } catch (error) {

        return "";

    }

}


/* =====================================================
DAILY LEARNING
===================================================== */

async function loadDailyLearning() {

    try {

        const response =
            await fetch(
                `${API_URL}?type=daily`,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load daily learning."
            );

        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                "Invalid daily learning response."
            );

        }


        displayDailyLearning(
            data
        );

    } catch (error) {

        console.error(
            "Daily Learning Error:",
            error
        );


        showLearningError();

    }

}


/* =====================================================
DISPLAY DAILY LEARNING
===================================================== */

function displayDailyLearning(
    data
) {

    const dateElement =
        document.getElementById(
            "dailyDate"
        );


    if (dateElement) {

        dateElement.textContent =
            formatDate(
                data.date
            );

    }


    displayVocabulary(
        data.vocabulary || []
    );


    displayOWS(
        data.ows || []
    );


    displayIdioms(
        data.idioms || []
    );

}


/* =====================================================
VOCABULARY
===================================================== */

function displayVocabulary(
    items
) {

    const container =
        document.getElementById(
            "vocabularyList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    items.forEach(
        (item, index) => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "learning_item";


            const hindiMeaning =
                item["Hindi Meaning"] ||
                item.HindiMeaning ||
                "";


            div.innerHTML = `
                <div>
                    <span class="learning_number">
                        ${index + 1}
                    </span>

                    <span class="learning_word">
                        ${escapeHTML(
                            item.Word || ""
                        )}
                    </span>
                </div>

                <div class="learning_meaning">
                    <span class="learning_label">
                        Meaning:
                    </span>
                    ${escapeHTML(
                        item.Meaning || ""
                    )}
                </div>

                <div class="learning_hindi">
                    <span class="learning_label">
                        Hindi:
                    </span>
                    ${escapeHTML(
                        hindiMeaning
                    )}
                </div>

                <div class="learning_example">
                    <span class="learning_label">
                        Example:
                    </span>
                    ${escapeHTML(
                        item.Example || ""
                    )}
                </div>

                <div class="learning_extra">
                    <span class="learning_label">
                        Synonym:
                    </span>
                    ${escapeHTML(
                        item.Synonym || ""
                    )}
                </div>

                <div class="learning_extra">
                    <span class="learning_label">
                        Antonym:
                    </span>
                    ${escapeHTML(
                        item.Antonym || ""
                    )}
                </div>

                <div class="learning_extra">
                    <span class="learning_label">
                        Explanation:
                    </span>
                    ${escapeHTML(
                        item.Explanation || ""
                    )}
                </div>
            `;


            container.appendChild(
                div
            );

        }
    );

}


/* =====================================================
OWS
===================================================== */

function displayOWS(
    items
) {

    const container =
        document.getElementById(
            "owsList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    items.forEach(
        (item, index) => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "learning_item";


            const hindiMeaning =
                item["Hindi Meaning"] ||
                item.HindiMeaning ||
                "";


            div.innerHTML = `
                <div>
                    <span class="learning_number">
                        ${index + 1}
                    </span>

                    <span class="learning_word">
                        ${escapeHTML(
                            item.Word || ""
                        )}
                    </span>
                </div>

                <div class="learning_meaning">
                    <span class="learning_label">
                        Phrase:
                    </span>
                    ${escapeHTML(
                        item.Phrase || ""
                    )}
                </div>

                <div class="learning_hindi">
                    <span class="learning_label">
                        Hindi:
                    </span>
                    ${escapeHTML(
                        hindiMeaning
                    )}
                </div>

                <div class="learning_extra">
                    <span class="learning_label">
                        Explanation:
                    </span>
                    ${escapeHTML(
                        item.Explanation || ""
                    )}
                </div>
            `;


            container.appendChild(
                div
            );

        }
    );

}


/* =====================================================
IDIOMS
===================================================== */

function displayIdioms(
    items
) {

    const container =
        document.getElementById(
            "idiomsList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    items.forEach(
        (item, index) => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "learning_item";


            const hindiMeaning =
                item["Hindi Meaning"] ||
                item.HindiMeaning ||
                "";


            const example =
                item["1 English Example"] ||
                item.Example ||
                "";


            div.innerHTML = `
                <div>
                    <span class="learning_number">
                        ${index + 1}
                    </span>

                    <span class="learning_word">
                        ${escapeHTML(
                            item.Idiom || ""
                        )}
                    </span>
                </div>

                <div class="learning_hindi">
                    <span class="learning_label">
                        Hindi:
                    </span>
                    ${escapeHTML(
                        hindiMeaning
                    )}
                </div>

                <div class="learning_example">
                    <span class="learning_label">
                        Example:
                    </span>
                    ${escapeHTML(
                        example
                    )}
                </div>

                <div class="learning_extra">
                    <span class="learning_label">
                        Explanation:
                    </span>
                    ${escapeHTML(
                        item.Explanation || ""
                    )}
                </div>
            `;


            container.appendChild(
                div
            );

        }
    );

}


/* =====================================================
QUIZ TABS
===================================================== */

function setupQuizTabs() {

    const tabs =
        document.querySelectorAll(
            ".quiz_tab"
        );


    tabs.forEach(
        tab => {

            tab.addEventListener(
                "click",
                () => {

                    tabs.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    tab.classList.add(
                        "active"
                    );


                    const type =
                        tab.dataset.quiz;


                    localStorage.setItem(
                        "lastQuizType",
                        type
                    );


                    loadQuiz(
                        type
                    );

                }
            );

        }
    );

}


/* =====================================================
RESTORE LAST QUIZ
===================================================== */

function restoreLastQuiz() {

    /*
     * Quiz must remain hidden after refresh.
     *
     * Function retained for compatibility.
     */

    const savedQuizType =
        localStorage.getItem(
            "lastQuizType"
        );


    const weeklyTab =
        document.getElementById(
            "weeklyCaTab"
        );


    if (
        savedQuizType ===
            "weekly-ca" &&
        (
            !weeklyTab ||
            weeklyTab.style.display ===
                "none"
        )
    ) {

        setActiveQuizTab(
            "vocab"
        );


        showQuizStartMessage();

        return;

    }


    if (!savedQuizType) {

        setActiveQuizTab(
            null
        );


        showQuizStartMessage();

        return;

    }


    setActiveQuizTab(
        savedQuizType
    );


    loadQuiz(
        savedQuizType
    );

}


/* =====================================================
SET ACTIVE QUIZ TAB
===================================================== */

function setActiveQuizTab(
    type
) {

    const tabs =
        document.querySelectorAll(
            ".quiz_tab"
        );


    tabs.forEach(
        tab => {

            tab.classList.toggle(
                "active",
                Boolean(type) &&
                tab.dataset.quiz === type
            );

        }
    );

}


/* =====================================================
QUIZ START MESSAGE
===================================================== */

function showQuizStartMessage() {

    const quizBox =
        document.getElementById(
            "quizBox"
        );


    const quizDate =
        document.getElementById(
            "quizDate"
        );


    if (quizDate) {

        quizDate.textContent =
            "Choose a quiz to start";

    }


    if (!quizBox) {

        return;

    }


    quizBox.innerHTML =
        `<div class="loading">
            Select a quiz above to begin.
        </div>`;

}


/* =====================================================
LOAD QUIZ
===================================================== */

async function loadQuiz(
    type
) {

    currentQuizType =
        type;


    currentQuiz =
        null;


    selectedAnswers = {};


    quizSubmitted =
        false;


    const quizBox =
        document.getElementById(
            "quizBox"
        );


    if (!quizBox) {

        return;

    }


    quizBox.innerHTML =
        `<div class="loading">
            Loading quiz...
        </div>`;


    try {

        let endpoint = "";


        if (
            type === "weekly-ca"
        ) {

            endpoint =
                `${API_URL}?type=weekly-ca-quiz`;

        } else {

            endpoint =
                `${API_URL}?type=${encodeURIComponent(type)}-quiz`;

        }


        const response =
            await fetch(
                endpoint,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load quiz."
            );

        }


        const data =
            await response.json();


        if (
            !data.success ||
            !Array.isArray(
                data.questions
            )
        ) {

            throw new Error(
                "Invalid quiz response."
            );

        }


        currentQuiz =
            data;


        const quizDate =
            document.getElementById(
                "quizDate"
            );


        if (
            quizDate &&
            data.date
        ) {

            quizDate.textContent =
                formatDate(
                    data.date
                );

        }


        displayQuiz(
            data
        );

    } catch (error) {

        console.error(
            "Quiz Error:",
            error
        );


        quizBox.innerHTML =
            `<div class="loading">
                Unable to load quiz.
                Please try again later.
            </div>`;

    }

}


/* =====================================================
DISPLAY QUIZ
===================================================== */

function displayQuiz(
    quiz
) {

    const quizBox =
        document.getElementById(
            "quizBox"
        );


    if (!quizBox) {

        return;

    }


    quizBox.innerHTML = "";


    const questions =
        quiz.questions || [];


    if (
        questions.length === 0
    ) {

        quizBox.innerHTML =
            `<div class="loading">
                No questions available.
            </div>`;

        return;

    }


    /*
     * Weekly quiz notice.
     */

    if (
        currentQuizType ===
        "weekly-ca"
    ) {

        const notice =
            document.createElement(
                "div"
            );


        notice.className =
            "weekly_quiz_notice";


        notice.textContent =
            "⭐ NEW — Weekly Current Affairs Quiz is available today only. It covers Current Affairs from last Sunday to Saturday.";


        quizBox.appendChild(
            notice
        );

    }


    /*
     * Progress.
     */

    const progress =
        document.createElement(
            "div"
        );


    progress.className =
        "quiz_progress";


    progress.id =
        "quizProgress";


    progress.textContent =
        `0 / ${questions.length} Questions Answered`;


    quizBox.appendChild(
        progress
    );


    /*
     * Questions.
     */

    questions.forEach(
        (
            question,
            questionIndex
        ) => {

            const questionDiv =
                document.createElement(
                    "div"
                );


            questionDiv.className =
                "quiz_question";


            questionDiv.dataset.index =
                questionIndex;


            const number =
                document.createElement(
                    "div"
                );


            number.className =
                "quiz_question_number";


            number.textContent =
                `Question ${questionIndex + 1}`;


            questionDiv.appendChild(
                number
            );


            /*
             * GKGS category labels are hidden.
             * Vocabulary and Weekly CA keep categories.
             */

            if (
                question.category &&
                currentQuizType !==
                    "gkgs"
            ) {

                const category =
                    document.createElement(
                        "div"
                    );


                category.className =
                    "quiz_category";


                category.textContent =
                    question.category;


                questionDiv.appendChild(
                    category
                );

            }


            const questionTitle =
                document.createElement(
                    "h3"
                );


            questionTitle.textContent =
                question.question || "";


            questionDiv.appendChild(
                questionTitle
            );


            const options =
                document.createElement(
                    "div"
                );


            options.className =
                "quiz_options";


            const optionList =
                getQuestionOptions(
                    question
                );


            optionList.forEach(
                (
                    option,
                    optionIndex
                ) => {

                    const button =
                        document.createElement(
                            "button"
                        );


                    button.type =
                        "button";


                    button.className =
                        "quiz_option";


                    button.dataset.optionIndex =
                        optionIndex;


                    button.textContent =
                        `${String.fromCharCode(
                            65 + optionIndex
                        )}. ${option}`;


                    button.addEventListener(
                        "click",
                        () => {

                            selectQuizOption(
                                questionIndex,
                                optionIndex
                            );

                        }
                    );


                    options.appendChild(
                        button
                    );

                }
            );


            questionDiv.appendChild(
                options
            );


            quizBox.appendChild(
                questionDiv
            );

        }
    );


    /*
     * Submit button.
     */

    const submitContainer =
        document.createElement(
            "div"
        );


    submitContainer.className =
        "quiz_submit_container";


    const submitButton =
        document.createElement(
            "button"
        );


    submitButton.type =
        "button";


    submitButton.className =
        "quiz_submit";


    submitButton.textContent =
        "Submit Quiz";


    submitButton.addEventListener(
        "click",
        submitQuiz
    );


    submitContainer.appendChild(
        submitButton
    );


    const submitMessage =
        document.createElement(
            "div"
        );


    submitMessage.className =
        "quiz_submit_message";


    submitMessage.id =
        "quizSubmitMessage";


    submitContainer.appendChild(
        submitMessage
    );


    quizBox.appendChild(
        submitContainer
    );

}


/* =====================================================
GET OPTIONS
===================================================== */

function getQuestionOptions(
    question
) {

    if (
        Array.isArray(
            question.options
        )
    ) {

        return question.options;

    }


    return [

        question.optionA || "",

        question.optionB || "",

        question.optionC || "",

        question.optionD || ""

    ];

}


/* =====================================================
SELECT OPTION
===================================================== */

function selectQuizOption(
    questionIndex,
    optionIndex
) {

    if (quizSubmitted) {

        return;

    }


    const questionDiv =
        document.querySelector(
            `.quiz_question[data-index="${questionIndex}"]`
        );


    if (!questionDiv) {

        return;

    }


    const buttons =
        questionDiv.querySelectorAll(
            ".quiz_option"
        );


    /*
     * Clicking currently selected option
     * again will deselect it.
     */

    if (
        selectedAnswers[
            questionIndex
        ] === optionIndex
    ) {

        delete selectedAnswers[
            questionIndex
        ];


        buttons.forEach(
            button => {

                button.classList.remove(
                    "selected"
                );

            }
        );

    } else {

        selectedAnswers[
            questionIndex
        ] =
            optionIndex;


        buttons.forEach(
            (
                button,
                index
            ) => {

                button.classList.toggle(
                    "selected",
                    index === optionIndex
                );

            }
        );

    }


    /*
     * Clear previous submit warning
     * whenever the user changes an answer.
     */

    const message =
        document.getElementById(
            "quizSubmitMessage"
        );


    if (message) {

        message.textContent =
            "";

    }


    updateQuizProgress();

}


/* =====================================================
UPDATE PROGRESS
===================================================== */

function updateQuizProgress() {

    const progress =
        document.getElementById(
            "quizProgress"
        );


    if (
        !progress ||
        !currentQuiz
    ) {

        return;

    }


    const total =
        currentQuiz.questions.length;


    const answered =
        Object.keys(
            selectedAnswers
        ).length;


    progress.textContent =
        `${answered} / ${total} Questions Answered`;

}


/* =====================================================
SUBMIT QUIZ
SERVER-SIDE GRADING
===================================================== */

async function submitQuiz() {

    if (
        !currentQuiz ||
        quizSubmitted
    ) {

        return;

    }


    const questions =
        currentQuiz.questions || [];


    const total =
        questions.length;


    const answered =
        Object.keys(
            selectedAnswers
        ).length;


    /*
     * Require all questions.
     */

    if (
        answered < total
    ) {

        const message =
            document.getElementById(
                "quizSubmitMessage"
            );


        if (message) {

            message.textContent =
                `Please answer all ${total} questions before submitting.`;

        }


        const firstUnanswered =
            questions.findIndex(
                (
                    _,
                    index
                ) =>
                    selectedAnswers[
                        index
                    ] === undefined
            );


        if (
            firstUnanswered >= 0
        ) {

            const element =
                document.querySelector(
                    `.quiz_question[data-index="${firstUnanswered}"]`
                );


            if (element) {

                element.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

        }


        return;

    }


    /*
     * Prevent double submission.
     */

    quizSubmitted =
        true;


    const submitButton =
        document.querySelector(
            ".quiz_submit"
        );


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.textContent =
            "Checking...";

    }


    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify({

                            type:
                                currentQuizType,

                            answers:
                                selectedAnswers

                        })

                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to submit quiz."
            );

        }


        const result =
            await response.json();


        if (
            !result.success
        ) {

            throw new Error(
                result.error ||
                "Quiz submission failed."
            );

        }


        /*
         * Server is now authoritative.
         */

        displayServerQuizResults(
            result
        );


        disableQuizOptions();


        showQuizScore(
            result.score,
            result.total,
            result.percentage
        );


    } catch (error) {

        console.error(
            "Quiz Submission Error:",
            error
        );


        /*
         * Allow retrying the submission if
         * the network/server request failed.
         */

        quizSubmitted =
            false;


        if (submitButton) {

            submitButton.disabled =
                false;


            submitButton.textContent =
                "Submit Quiz";

        }


        const message =
            document.getElementById(
                "quizSubmitMessage"
            );


        if (message) {

            message.textContent =
                "Unable to submit the quiz. Please try again.";

        }

    }

}


/* =====================================================
DISPLAY SERVER QUIZ RESULTS
===================================================== */

function displayServerQuizResults(
    result
) {

    if (
        !result ||
        !Array.isArray(
            result.results
        )
    ) {

        return;

    }


    result.results.forEach(
        item => {

            showQuestionResultFromServer(
                item
            );

        }
    );

}


/* =====================================================
SHOW QUESTION RESULT
FROM SERVER
===================================================== */

function showQuestionResultFromServer(
    result
) {

    const questionIndex =
        Number(
            result.questionIndex
        );


    const selectedIndex =
        Number(
            result.selectedIndex
        );


    const correctIndex =
        Number(
            result.correctIndex
        );


    const questionDiv =
        document.querySelector(
            `.quiz_question[data-index="${questionIndex}"]`
        );


    if (!questionDiv) {

        return;

    }


    const buttons =
        questionDiv.querySelectorAll(
            ".quiz_option"
        );


    buttons.forEach(
        (
            button,
            index
        ) => {

            button.classList.remove(
                "selected",
                "correct",
                "wrong"
            );


            if (
                index === correctIndex
            ) {

                button.classList.add(
                    "correct"
                );

            }


            if (
                index === selectedIndex &&
                selectedIndex !== correctIndex
            ) {

                button.classList.add(
                    "wrong"
                );

            }

        }
    );


    const existingAnswer =
        questionDiv.querySelector(
            ".quiz_answer"
        );


    if (existingAnswer) {

        existingAnswer.remove();

    }


    const answerBox =
        document.createElement(
            "div"
        );


    answerBox.className =
        "quiz_answer";


    const isCorrect =
        Boolean(
            result.isCorrect
        );


    const status =
        document.createElement(
            "div"
        );


    status.className =
        `quiz_result_status ${
            isCorrect
                ? "correct_status"
                : "wrong_status"
        }`;


    status.textContent =
        isCorrect
            ? "✓ Correct Answer"
            : "✗ Wrong Answer";


    answerBox.appendChild(
        status
    );


    const selectedLine =
        document.createElement(
            "div"
        );


    selectedLine.className =
        "quiz_result_line";


    selectedLine.innerHTML =
        `<strong>Your Answer:</strong>
         ${escapeHTML(
             result.selectedText ||
             "Not answered"
         )}`;


    answerBox.appendChild(
        selectedLine
    );


    const correctLine =
        document.createElement(
            "div"
        );


    correctLine.className =
        "quiz_result_line";


    correctLine.innerHTML =
        `<strong>Correct Answer:</strong>
         ${escapeHTML(
             result.correctText ||
             ""
         )}`;


    answerBox.appendChild(
        correctLine
    );


    if (
        result.explanation
    ) {

        const explanation =
            document.createElement(
                "div"
            );


        explanation.className =
            "quiz_result_line";


        explanation.innerHTML =
            `<strong>Explanation:</strong>
             ${formatExplanation(
                 result.explanation
             )}`;


        answerBox.appendChild(
            explanation
        );

    }


    /*
     * Option explanations.
     */

    const optionExplanations =
        result.optionExplanations &&
        typeof result.optionExplanations ===
            "object"
            ? result.optionExplanations
            : {};


    if (
        Object.keys(
            optionExplanations
        ).length > 0
    ) {

        const question =
            currentQuiz &&
            currentQuiz.questions
                ? currentQuiz.questions[
                    questionIndex
                  ]
                : null;


        if (question) {

            const options =
                getQuestionOptions(
                    question
                );


            const explanationContainer =
                document.createElement(
                    "div"
                );


            explanationContainer.className =
                "quiz_option_explanations";


            const title =
                document.createElement(
                    "div"
                );


            title.className =
                "quiz_option_explanations_title";


            title.textContent =
                "Option Explanations";


            explanationContainer.appendChild(
                title
            );


            options.forEach(
                (
                    option,
                    optionIndex
                ) => {

                    const explanation =
                        getOptionExplanation(
                            optionExplanations,
                            option,
                            optionIndex
                        );


                    if (!explanation) {

                        return;

                    }


                    const div =
                        document.createElement(
                            "div"
                        );


                    div.className =
                        "quiz_option_explanation";


                    if (
                        optionIndex ===
                        correctIndex
                    ) {

                        div.classList.add(
                            "correct_option_explanation"
                        );

                    }


                    if (
                        optionIndex ===
                            selectedIndex &&
                        optionIndex !==
                            correctIndex
                    ) {

                        div.classList.add(
                            "wrong_option_explanation"
                        );

                    }


                    div.innerHTML =
                        `<strong>
                            ${String.fromCharCode(
                                65 + optionIndex
                            )}. ${escapeHTML(
                                option
                            )}
                        </strong>
                        <br>
                        ${formatExplanation(
                            explanation
                        )}`;


                    explanationContainer.appendChild(
                        div
                    );

                }
            );


            answerBox.appendChild(
                explanationContainer
            );

        }

    }


    questionDiv.appendChild(
        answerBox
    );

}


/* =====================================================
GET CORRECT OPTION INDEX
LEGACY COMPATIBILITY ONLY
===================================================== */

/*
 * IMPORTANT:
 *
 * This function is no longer used for scoring.
 * The server now performs the actual grading.
 *
 * It is retained in case another part of the
 * page/script calls it.
 */

function getCorrectOptionIndex(
    question
) {

    const options =
        getQuestionOptions(
            question
        );


    const answer =
        question.answer;


    if (
        typeof answer === "number" &&
        answer >= 0 &&
        answer < options.length
    ) {

        return answer;

    }


    if (
        typeof answer === "string"
    ) {

        const trimmed =
            answer.trim();


        const upper =
            trimmed.toUpperCase();


        if (
            ["A", "B", "C", "D"].includes(
                upper
            )
        ) {

            return (
                upper.charCodeAt(0) -
                65
            );

        }


        const letterMatch =
            trimmed.match(
                /^([A-D])\./i
            );


        if (letterMatch) {

            return (
                letterMatch[1]
                    .toUpperCase()
                    .charCodeAt(0) -
                65
            );

        }


        const answerIndex =
            options.findIndex(
                option =>
                    String(option)
                        .trim()
                        .toLowerCase() ===
                    trimmed.toLowerCase()
            );


        if (
            answerIndex >= 0
        ) {

            return answerIndex;

        }

    }


    return -1;

}


/* =====================================================
LEGACY SHOW QUESTION RESULT
===================================================== */

function showQuestionResult(
    question,
    questionIndex,
    selectedIndex,
    correctIndex
) {

    /*
     * Retained for compatibility.
     *
     * Actual quiz results now come from
     * showQuestionResultFromServer().
     */

    const questionDiv =
        document.querySelector(
            `.quiz_question[data-index="${questionIndex}"]`
        );


    if (!questionDiv) {

        return;

    }


    const buttons =
        questionDiv.querySelectorAll(
            ".quiz_option"
        );


    buttons.forEach(
        (
            button,
            index
        ) => {

            button.classList.remove(
                "selected",
                "correct",
                "wrong"
            );


            if (
                index === correctIndex
            ) {

                button.classList.add(
                    "correct"
                );

            }


            if (
                index === selectedIndex &&
                selectedIndex !== correctIndex
            ) {

                button.classList.add(
                    "wrong"
                );

            }

        }
    );

}


/* =====================================================
OPTION EXPLANATIONS
===================================================== */

function getOptionExplanations(
    question
) {

    if (
        question.optionExplanations &&
        typeof question.optionExplanations ===
            "object"
    ) {

        return question.optionExplanations;

    }


    return {};

}


function getOptionExplanation(
    explanations,
    option,
    index
) {

    if (
        explanations[option]
    ) {

        return explanations[
            option
        ];

    }


    const letter =
        String.fromCharCode(
            65 + index
        );


    if (
        explanations[letter]
    ) {

        return explanations[
            letter
        ];

    }


    const keys =
        Object.keys(
            explanations
        );


    const matchingKey =
        keys.find(
            key =>
                key.trim()
                    .toLowerCase() ===
                String(option)
                    .trim()
                    .toLowerCase()
        );


    if (matchingKey) {

        return explanations[
            matchingKey
        ];

    }


    return "";

}


/* =====================================================
DISABLE QUIZ
===================================================== */

function disableQuizOptions() {

    document
        .querySelectorAll(
            ".quiz_option"
        )
        .forEach(
            button => {

                button.disabled =
                    true;

            }
        );


    const submitButton =
        document.querySelector(
            ".quiz_submit"
        );


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.textContent =
            "Quiz Submitted";

    }

}


/* =====================================================
QUIZ SCORE + RETRY
===================================================== */

function showQuizScore(
    score,
    total,
    percentage
) {

    const quizBox =
        document.getElementById(
            "quizBox"
        );


    if (!quizBox) {

        return;

    }


    const oldScore =
        quizBox.querySelector(
            ".quiz_score"
        );


    if (oldScore) {

        oldScore.remove();

    }


    const scoreBox =
        document.createElement(
            "div"
        );


    scoreBox.className =
        "quiz_score";


    const safePercentage =
        Number.isFinite(
            Number(
                percentage
            )
        )
            ? Number(
                percentage
            )
            : (
                total > 0
                    ? Math.round(
                        (
                            score /
                            total
                        ) *
                        100
                    )
                    : 0
            );


    scoreBox.innerHTML =
        `Quiz Completed 🎉

        <div class="quiz_score_details">
            Your Score: ${score} / ${total}
            <br>
            Percentage: ${safePercentage}%
        </div>`;


    /*
     * Retry Quiz button.
     */

    const retryButton =
        document.createElement(
            "button"
        );


    retryButton.type =
        "button";


    retryButton.className =
        "quiz_submit";


    retryButton.textContent =
        "Retry Quiz";


    retryButton.addEventListener(
        "click",
        retryQuiz
    );


    scoreBox.appendChild(
        retryButton
    );


    quizBox.appendChild(
        scoreBox
    );


    /*
     * After submitting:
     * Move window to score.
     */

    setTimeout(
        () => {

            scoreBox.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        },
        100
    );

}


/* =====================================================
RETRY QUIZ
===================================================== */

function retryQuiz() {

    if (!currentQuiz) {

        return;

    }


    /*
     * Reuse the exact same quiz.
     *
     * Do NOT fetch a new quiz.
     */

    selectedAnswers = {};


    quizSubmitted =
        false;


    displayQuiz(
        currentQuiz
    );


    /*
     * Move to Question 1.
     */

    setTimeout(
        () => {

            const firstQuestion =
                document.querySelector(
                    '.quiz_question[data-index="0"]'
                );


            if (firstQuestion) {

                firstQuestion.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        },
        100
    );

}


/* =====================================================
WEEKLY QUIZ
===================================================== */

async function checkWeeklyQuiz() {

    const weeklyTab =
        document.getElementById(
            "weeklyCaTab"
        );


    if (!weeklyTab) {

        return false;

    }


    try {

        const response =
            await fetch(
                `${API_URL}?type=weekly-ca-status`,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            weeklyTab.style.display =
                "none";


            return false;

        }


        const data =
            await response.json();


        if (
            data.success &&
            data.available === true
        ) {

            weeklyTab.style.display =
                "block";


            addWeeklyNewBadge();


            return true;

        } else {

            weeklyTab.style.display =
                "none";


            removeWeeklyNewBadge();


            return false;

        }

    } catch (error) {

        console.error(
            "Weekly Quiz Status Error:",
            error
        );


        weeklyTab.style.display =
            "none";


        removeWeeklyNewBadge();


        return false;

    }

}


/* =====================================================
WEEKLY NEW BADGE
===================================================== */

function addWeeklyNewBadge() {

    const weeklyTab =
        document.getElementById(
            "weeklyCaTab"
        );


    if (!weeklyTab) {

        return;

    }


    /*
     * Prevent duplicate badges.
     */

    const existingBadge =
        weeklyTab.querySelector(
            ".weekly_new_badge"
        );


    if (existingBadge) {

        return;

    }


    const badge =
        document.createElement(
            "span"
        );


    badge.className =
        "weekly_new_badge";


    badge.textContent =
        "NEW";


    weeklyTab.appendChild(
        badge
    );

}


/* =====================================================
REMOVE WEEKLY NEW BADGE
===================================================== */

function removeWeeklyNewBadge() {

    const weeklyTab =
        document.getElementById(
            "weeklyCaTab"
        );


    if (!weeklyTab) {

        return;

    }


    const badge =
        weeklyTab.querySelector(
            ".weekly_new_badge"
        );


    if (badge) {

        badge.remove();

    }

}


/* =====================================================
ERRORS
===================================================== */

function showLearningError() {

    [

        "vocabularyList",

        "owsList",

        "idiomsList"

    ].forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.innerHTML =
                    `<div class="loading">
                        Unable to load content.
                    </div>`;

            }

        }
    );

}


/* =====================================================
DATE FORMAT
===================================================== */

function formatDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            dateString
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateString
        );

    }


    return date.toLocaleDateString(
        "en-IN",
        {

            day: "numeric",

            month: "long",

            year: "numeric"

        }
    );

}


/* =====================================================
EXPLANATION FORMAT
===================================================== */

function formatExplanation(
    text
) {

    if (!text) {

        return "";

    }


    return escapeHTML(
        String(text)
    ).replace(
        /\n/g,
        "<br>"
    );

}


/* =====================================================
HTML ESCAPE
===================================================== */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}