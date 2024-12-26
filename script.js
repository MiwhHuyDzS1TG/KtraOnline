document.addEventListener("DOMContentLoaded", function () {
    const timerElement = document.getElementById("timer");
    const scoreResultElement = document.getElementById("scoreResult");
    const submitButton = document.querySelector("#submit-btn");

    // Quản lý thời gian (45 phút mặc định)
    let timeLeft = localStorage.getItem("timeLeft")
        ? parseInt(localStorage.getItem("timeLeft"))
        : 45 * 60;

    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `Thời gian còn lại: ${minutes}:${seconds.toString().padStart(2, "0")}`;

        if (timeLeft > 0) {
            timeLeft -= 1;
            localStorage.setItem("timeLeft", timeLeft);
        } else {
            clearInterval(timerInterval);
            alert("Hết giờ làm bài!");
            gradeExam(); // Tự động nộp bài khi hết giờ
            submitButton.disabled = true; // Vô hiệu hóa nút nộp bài
        }
    }

    const timerInterval = setInterval(updateTimer, 1000);

    // Hàm tính điểm
    async function gradeExam() {
        const response = await fetch("answers.json");
        const answers = await response.json();

        let score = 0;
        let mcqScore = 0;
        let tfScore = 0;
        let saScore = 0;

        // Phần 1: Multiple Choice Questions
        const mcqAnswers = answers.multipleChoice;
        for (let q in mcqAnswers) {
            const selected = document.querySelector(`input[name="${q}"]:checked`);
            if (selected && selected.value === mcqAnswers[q]) {
                mcqScore += 0.25;
            }
        }

        // Phần 2: True/False Questions
        const tfAnswers = answers.trueFalse;
        for (let qGroup = 1; qGroup <= 4; qGroup++) {
            let correctCount = 0;
            for (let subQuestion of ['a', 'b', 'c', 'd']) {
                const q = `q${qGroup}${subQuestion}`;
                const selected = document.querySelector(`input[name="${q}"]:checked`);
                if (selected && selected.value === tfAnswers[q]) {
                    correctCount++;
                }
            }
            if (correctCount === 1) tfScore += 0.1;
            else if (correctCount === 2) tfScore += 0.25;
            else if (correctCount === 3) tfScore += 0.5;
            else if (correctCount === 4) tfScore += 1;
        }

        // Phần 3: Short Answer Questions
        const saAnswers = answers.shortAnswer;
        for (let q in saAnswers) {
            const userAnswer = document.querySelector(`input[name="${q}"]`).value.trim();
            if (userAnswer === saAnswers[q]) {
                saScore += 0.5;
            }
        }

        // Tính tổng điểm
        score = mcqScore + tfScore + saScore;

        // Hiển thị điểm chi tiết từng phần
        const scoreDetail = `
            <p>Điểm chi tiết:</p>
            <ul>
                <li>Multiple Choice: ${mcqScore.toFixed(2)} điểm</li>
                <li>True/False: ${tfScore.toFixed(2)} điểm</li>
                <li>Short Answer: ${saScore.toFixed(2)} điểm</li>
            </ul>
        `;

        // Hiển thị điểm tổng cộng
        scoreResultElement.innerHTML = `Tổng điểm của bạn là: ${score.toFixed(2)} / 10.00 <br> ${scoreDetail}`;
        alert(`Kết quả: ${score.toFixed(2)} điểm`);
    }

    // Sự kiện "Nộp bài"
    submitButton.addEventListener("click", () => {
        clearInterval(timerInterval); // Dừng đếm giờ khi nộp bài
        gradeExam();
        submitButton.disabled = true; // Vô hiệu hóa nút nộp bài sau khi nhấn
    });

    // Lưu đáp án vào localStorage khi học sinh chọn đáp án
    const allQuestions = document.querySelectorAll('input[type="radio"], input[type="text"]');
    
    allQuestions.forEach(input => {
        input.addEventListener("change", function () {
            const answers = {};
            allQuestions.forEach(input => {
                if (input.type === "radio" && input.checked) {
                    answers[input.name] = input.value;
                } else if (input.type === "text") {
                    answers[input.name] = input.value;
                }
            });
            localStorage.setItem("answers", JSON.stringify(answers));  // Lưu đáp án vào localStorage
        });
    });

    // Tải lại các đáp án đã lưu từ localStorage
    function loadSavedAnswers() {
        const savedAnswers = JSON.parse(localStorage.getItem("answers"));
        if (savedAnswers) {
            Object.keys(savedAnswers).forEach(question => {
                const answer = savedAnswers[question];
                const input = document.querySelector(`[name="${question}"][value="${answer}"]`);
                if (input) {
                    input.checked = true;  // Đánh dấu đáp án đã chọn
                } else {
                    const textInput = document.querySelector(`[name="${question}"]`);
                    if (textInput) textInput.value = answer;  // Điền lại câu trả lời ngắn
                }
            });
        }
    }

    loadSavedAnswers();  // Tải lại đáp án khi trang được tải lại

    // Xóa dữ liệu localStorage khi tải lại trang (chỉ phục vụ cho quá trình thử nghiệm)
    window.addEventListener("beforeunload", () => {
        localStorage.removeItem("timeLeft");
    });
});
