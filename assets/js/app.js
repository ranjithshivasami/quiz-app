var App = (function () {
    /* $ sign used to distinguish between the elemnts and variablse for conventions */
    let $formParticipant;
    let $backdrop;
    let $name;
    let $questionSection;
    let $quesionId;
    let $question;
    let $answerOptions;

    let url;
    let apiVersion = 'api/v1/'
    let orderText;
    let participantId;

    function init() {

        $backdrop = $('#backdrop');
        $formParticipant = $("#form-participant");
        $name = $("#name");
        $questionSection = $('#question-section');
        $question = $('#question');
        $quesionId = $('#quesion-id');
        $answerOptions = $('#answer-options');

        orderText = ['A', 'B', 'C', 'D'];
        url = appConfig.apiUrl + apiVersion;
        participantId = null;
        initFormValidation();
        initClickEvents();
    }

    function errorHandler(jqXHR, exception) {
        $backdrop.hide();
        if (jqXHR.status === 0) {
            toastr.error('Not connect.\n Verify Network.', 'Error!');
        } else if (jqXHR.status == 404) {
            toastr.error('Requested url not found. [404].', 'Error!');
        } else if (jqXHR.status == 500) {
            toastr.error('Internal Server Error [500].', 'Error!');
        } else if (exception === 'parsererror') {
            toastr.error('Requested JSON parse failed.', 'Error!');
        } else if (exception === 'timeout') {
            toastr.error('Time out error.', 'Error!');
        } else if (exception == 'abort') {
            toastr.error('Ajax request aborted.', 'Error!');
        } else {
            toastr.error('Uncaught Error.\n' + jqXHR.responseText, 'Error!');
        }
    }

    function initFormValidation() {
        $("#form-participant").validate({
            rules: {
                name: {
                    required: true,
                    minlength: 3,
                },
            },
            message: {
                name: {
                    required: "Please enter a name",
                    minlength: 3,
                },
            },
            errorPlacement: function (error, element) {
                let $parent = element.parent('.input-group');
                error.insertAfter($parent);
            },
            submitHandler: function (form) {
                let param = {
                    url: url + 'create-participant',
                    method: 'POST',
                    data: { 'name': $name.val() }
                }
                let creatParticipantSuccessHandler = function (response) {
                    $backdrop.hide();
                    $quesionId.val('');
                    $question.text('');
                    $answerOptions.html('');
                    participantId = response.participant_id;
                    getQuizQuestion();
                };
                makeApiCall(param, creatParticipantSuccessHandler, errorHandler);
            }
        });
    }

    function getQuizQuestion() {
        $questionSection.removeClass('d-none');
        let param = {
            url: url + 'quiz-question',
            method: 'GET',
            data: null
        }
        let getQuestionSuccessHandler = function (response) {
            $backdrop.hide();

            $quesionId.val(response.id);
            $question.text(response.question);

            let HtmlOption = ``;
            let options = response.options;

            $.each(options, function (i, optionObj) {
                HtmlOption += `<div>
                                <label class="radio-inline">
                                <input type="radio" name="option" value="${optionObj.id}" /> ( ${orderText[i]} )  ${optionObj.answer}
                                </label>
                            </div>`;
            });
            $answerOptions.html(HtmlOption + ` <div class="input-group mt-5">
               <button type="submit" id="submit-answer" class="btn btn-primary">Submit </button>
             </div>`);

        };
        makeApiCall(param, getQuestionSuccessHandler, errorHandler);
    }

    function initClickEvents() {
        $('body').on('click', "#submit-answer", function () {
            let checkedCount = 0;
            let answerId;
            if ($("input:radio[name='option']").is(":checked")) {
                checkedCount++;
                answerId = $("input:radio[name='option']").val();
            }
            if (checkedCount === 0) {
                toastr.error('Requested JSON parse failed.', 'Error!');
            }
            submitAnswer(answerId);

        });
    }

    function submitAnswer(answerId) {
        $backdrop.show();
        let param = {
            url: url + 'store-participants-answer',
            method: 'POST',
            data: {
                "participant_id": participantId,
                "quiz_answer_id": answerId
            }
        };
        let submitAnswerSuccessHandler = function (response) {
            $backdrop.hide();
            getParticipantAnswers();
        };
        makeApiCall(param, submitAnswerSuccessHandler, errorHandler);
    }

    function getParticipantAnswers() {
        let param = {
            url: url + 'participants-answers',
            method: 'GET',
            data: null
        };
        let getParticipantAnswersSuccessHandler = function (response) {
            $quesionId.val('');
            $question.text('');

            let HtmlOption = ``;

            $.each(response, function (i, optionObj) {
                let answer_count = optionObj.answer_count;
                let textSufixx = (answer_count > 1) ? 'results' : 'result';
                HtmlOption += `<div>
                                <label class="radio-inline">
                                ( ${orderText[i]} )  ${optionObj.answer} ${optionObj.percentage} % - ${answer_count} ${textSufixx}
                                </label>
                            </div>`;
            });
            $answerOptions.html(HtmlOption);
            $name.val('');
            $backdrop.hide();
        };
        makeApiCall(param, getParticipantAnswersSuccessHandler, errorHandler);
    }

    function makeApiCall(param, succesCallback, errorCallback) {
        try {
            let data = (param.data !== null) ? JSON.stringify(param.data) : null;
            $.ajax({
                method: param.method,
                url: param.url,
                data: data,
                dataType: 'JSON',
                headers: {
                    'Content-Type': 'application/json'
                },
                beforeSend: function () {
                    $backdrop.show();
                },
                timeout: 5000,
                success: succesCallback,
                error: errorCallback
            });
        }
        catch (err) {
            toastr.error(err.message, "Error!");
        }
    }

    return {
        init: init,
    };

})(jQuery);

$(document).ready(function () {
    App.init();
});