var H5PPresave = H5PPresave || {};
var H5PEditor = H5PEditor || {};


/**
 * Function to go thr all elements of a Course Presentation and perform the separate calculations before returning a aggregated result
 *
 * @param content
 * @param finished
 * @constructor
 */
H5PPresave['H5P.CoursePresentationCFRD'] = function (content, finished) {
  var presave = H5PEditor.Presave;

  if (isContentInvalid()) {
    throw new presave.exceptions.InvalidContentSemanticsException('Invalid Course Presentation Error');
  }

  validateLevelMode();
  validateNavigationAppearance();

  var score = content.presentation.slides
    .map(function (value, index) {
      var slide = content.presentation.slides[index];
      if (!slide.hasOwnProperty('elements')) {
        return [];
      }
      return slide.elements;
    })
    .filter(function (elements) {
      return elements.length > 0;
    })
    .reduce(function (previous, current) {
      return previous.concat(current);
    }, [])
    .map(function (element) {
      if (element.hasOwnProperty('action')) {
        return element.action;
      }
      return {};
    })
    .filter(function (action) {
      return action.hasOwnProperty('library') && action.hasOwnProperty('params');
    })
    .map(function (action) {
      return (new presave).process(action.library, action.params).maxScore;
    })
    .reduce(function (currentScore, scoreToAdd) {
      if (presave.isInt(scoreToAdd)) {
        currentScore += scoreToAdd;
      }
      return currentScore;
    }, 0);

  presave.validateScore(score);

  finished({maxScore: score});

  /**
   * Check if required parameters is present
   * @return {boolean}
   */
  function isContentInvalid() {
    return !presave.checkNestedRequirements(content, 'content.presentation.slides') || !Array.isArray(content.presentation.slides);
  }

  /**
   * Level mode needs one scored activity per authored slide and must not use
   * options that remove the summary slide.
   */
  function validateLevelMode() {
    if (!content.levelMode || !content.levelMode.enabled) {
      return;
    }

    if (content.override && (content.override.activeSurface || content.override.hideSummarySlide)) {
      throw new presave.exceptions.InvalidContentSemanticsException(
        'Level mode requires Active Surface Mode and Hide Summary Slide to be disabled.'
      );
    }

    content.presentation.slides.forEach(function (slide, index) {
      var scoredActivities = (slide.elements || [])
        .filter(function (element) {
          return element.action &&
            element.action.library &&
            element.action.params;
        })
        .map(function (element) {
          return (new presave).process(
            element.action.library,
            element.action.params
          ).maxScore;
        })
        .filter(function (maxScore) {
          return presave.isInt(maxScore) && maxScore > 0;
        });

      if (scoredActivities.length !== 1) {
        throw new presave.exceptions.InvalidContentSemanticsException(
          'Level mode requires exactly one scored activity on slide ' + (index + 1) + '.'
        );
      }

      if (
        content.levelMode.criterion === 'score' &&
        Number(content.levelMode.minimumScore || 0) > scoredActivities[0]
      ) {
        throw new presave.exceptions.InvalidContentSemanticsException(
          'The minimum level score exceeds the maximum score on slide ' + (index + 1) + '.'
        );
      }
    });
  }

  /**
   * Dots navigation and level mode both own the progress chrome and must not
   * be combined. The Finish gate also requires a visible summary slide.
   */
  function validateNavigationAppearance() {
    var nav = content.navigationAppearance || {};
    var isDots = nav.style === 'dots';
    var finishEnabled = !!nav.finishButtonEnabled;

    if (!isDots && !finishEnabled) {
      return;
    }

    if (content.levelMode && content.levelMode.enabled && isDots) {
      throw new presave.exceptions.InvalidContentSemanticsException(
        'Dots navigation cannot be combined with level mode.'
      );
    }

    if (finishEnabled && !isDots) {
      throw new presave.exceptions.InvalidContentSemanticsException(
        'The Finish button requires the dots navigation style.'
      );
    }

    if (finishEnabled && content.override && content.override.hideSummarySlide) {
      throw new presave.exceptions.InvalidContentSemanticsException(
        'The Finish button requires Hide Summary Slide to be disabled.'
      );
    }

    if (finishEnabled && content.levelMode && content.levelMode.enabled) {
      throw new presave.exceptions.InvalidContentSemanticsException(
        'The Finish button cannot be combined with level mode.'
      );
    }
  }
};
