// Gus Hahn-Powell Dec, 2014
// TODO: add palate pen & points

// Added button glyphs, arrow key actions & automatic smoothing
$(window).load(function () {
    // avoid the circa 1990 look while loading...
    $(".loader").fadeOut("slow");
    var files = [];
    var idx = 0;
    var numFiles = files.length;
    var currentImage = new Image();
    var points = [];
    var roi = {};
    var newPoints = [];
    var contextPoints = {};
    var tracedFiles = {};
    var imageFiles = [];
    var currentImageName = "do-not-save.png";

    var mode = "pen";

    canvas = $("#tracearea")[0];
    context = canvas.getContext("2d");
    // after canvas has been defined...
    //context.setLineDash([10]);

    function setPenContext() {
        context.lineWidth = 2.5;
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.strokeStyle = '#ff0000'; // red
    }

    function setInactivePointContext() {
      setPenContext();
      //change the color
      context.strokeStyle = '#996666';
    }

    function setRoIContext() {
        context.lineWidth = 4;
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.strokeStyle = "#0000FF"; // blue
    }

    // Run this after the context has been set
    changeImg("static/images/do-not-save.png");

    roi = maximizeRoI();
    displayRoICoords();

    function displayRoICoords() {
        console.log("left X  = " + roi.srcX +
        "\nbottom Y = " + roi.srcY +
        "\nright X = " + roi.srcX + roi.destX +
        "\ntop Y = " + roi.srcY + roi.destY +
        "\n")
    }


    var isDrawing;

    function getMousePos(canvas, event) {
        var mouseX = parseInt(event.pageX - canvas.offsetLeft);
        var mouseY = parseInt(event.pageY - canvas.offsetTop);
        return {
            x: mouseX,
            y: mouseY
        };
    }


    function maximizeRoI() {
        console.log("maximizing R o I...")
        return {
            srcX: 0,
            srcY: 0,
            destX: canvas.width,
            destY: canvas.height
        };
    }

    function resetRoI() {
        roi = maximizeRoI();
        redraw();
    }

    function updateRoI(src, dest) {
        roi.srcX = src.x;
        roi.srcY = src.y;
        roi.destX = dest.x - src.x;
        roi.destY = dest.y - src.y;
    }


    function drawRoI() {
        setRoIContext();
        //console.log("drawing RoI...");
        context.beginPath();
        context.rect(roi.srcX, roi.srcY, roi.destX, roi.destY);
        context.stroke();
    }

    function handleRoI(e) {
        var startCoords = getMousePos(canvas, e);


        //setContext();
        isDrawing = true;

        canvas.onmousemove = function (e) {
            if (isDrawing) {
                // Draw as we go
                var currentCoords = getMousePos(canvas, e);
                updateRoI(startCoords, currentCoords);
                redraw();
            }
        };
        //context.clearRect(0, 0, canvas.width, canvas.height);

        canvas.onmouseup = function (e) {
            isDrawing = false;
            var currentCoords = getMousePos(canvas, e);
            updateRoI(startCoords, currentCoords);
            redraw();
        };
    }

    function withinRoI(point) {
        //displayRoICoords();

        return (
        (point.x > roi.srcX) &&
        (point.x < roi.srcX + roi.destX) &&
        (point.y > roi.srcY) &&
        (point.y < roi.srcY + roi.destY)
        )
    }

    function uniquePoints(points) {
        return _.uniq(points, function (newPoint) {return newPoint.x; }); // get rid of duplicates.
    }

    function filterPoints() {
        points = _.filter(points, function (point) {
            return withinRoI(point)
        });
    }

    // handle mouse action here.
    function draw(e) {
        setPenContext();
        isDrawing = true;
        context.beginPath();
        var coords = getMousePos(canvas, e);

        context.moveTo(coords.x, coords.y);


        canvas.onmousemove = function (e) {
            if (isDrawing) {
                var coords = getMousePos(canvas, e);
                newPoints.push(coords);

                context.lineTo(coords.x, coords.y);
                context.stroke();
            }
        };

        canvas.onmouseup = function () {
            isDrawing = false;
            //context.beginPath();
            newPoints = uniquePoints(newPoints);
            //console.log("smoothing " + newPoints.length + " unique points...");
            newPoints = smooth(newPoints);

            //Prefer the new points...
            _.each(newPoints, function (newPoint) {
                points = _.filter(points, function (oldPoint) {
                    return oldPoint.x != newPoint.x
                });
            });

            points = points.concat(newPoints);
            newPoints = [];
            smoothAndRedraw();
            //console.log("current points: " + JSON.stringify(points));
        };
    }

    // connect the dots!
    function redraw() {
        clear();
        setPenContext();
        //filterPoints();
        points = sortPoints(points);
        for (var i = 0; i < points.length - 1; i++) {
            var point = points[i];
            // Is our point within the RoI?
            (withinRoI(point) == true) ? setPenContext() : setInactivePointContext();
            var nextPoint = points[i + 1];

            context.beginPath();
            context.moveTo(point.x, point.y);
            context.lineTo(nextPoint.x, nextPoint.y);
            context.stroke();
        }
        drawRoI();
    }

    function sortPoints(points) {
        return _.sortBy(points, function (p) {
            return p.x;
        });
    }

    // TODO: Change eraser so that any points with x values matching erased span are thrown out
    function erase(e) {
        toErase = [];
        toErase.push(getMousePos(canvas, e));

        canvas.onmousemove = function (e) {
            toErase.push(getMousePos(canvas, e));
        };

        // we're using an eraser
        canvas.onmouseup = function () {
            toErase = smooth(toErase);
            for (var j = 0; j < toErase.length; j++) {
              console.log("eraseable " + j);
              var erasable = toErase[j];
              points = _.filter(points, function(point) {return  erasable.x != point.x; });
            }
            points = smooth(points);
            smoothAndRedraw();
        };
    }

    canvas.onmousedown = function (e) {
        switch (mode) {

            case "pen":
                draw(e);
                break;
            case "roi":
                handleRoI(e);
                //mode = "pen";
                break;
            case "eraser":
                erase(e);
                break
        }
    };

    function clear() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(currentImage, 0, 0);
    }

    function clearAll() {
        deletePoints();
        clear();
        redraw();
    }

    function smoothed(points) {
        // ensure distance between all neighboring points <= 1
        for (var i = 0; i < points.length - 1; i++) {
            p = points[i];
            nextP = points[i + 1];
            if (Math.abs(p.x - nextP.x) > 1) return false
        }
        return true
    }

    //Uses a recursive call to ensure distance between contiguous points (i.e. n & n+1) is never greater than 1.
    function smooth(points) {
        // do we have points?
        if (points.length != 0) {
            // sort them before doing anything
            points = sortPoints(points);
            //console.log("sorted " + points.length + " points...");
            var smoothedPoints = [];
            for (var i = 0; i < points.length - 1; i++) {
                var currentPoint = points[i];
                var nextPoint = points[i + 1];
                // keep the current point
                smoothedPoints.push(currentPoint);
                if (Math.abs(currentPoint.x - nextPoint.x) > 1) {
                    var midPoint = {
                        x: parseInt((currentPoint.x + nextPoint.x) / 2),
                        y: parseInt((currentPoint.y + nextPoint.y) / 2)
                    };
                    // keep this new point
                    smoothedPoints.push(midPoint);
                }
            }
            // don't forget about the last point
            smoothedPoints.push(_.last(points));
            points = smoothedPoints;
        }
        // smooth until convergence
        return (smoothed(points) == false) ? smooth(points) : uniquePoints(points);
    }

    function smoothAndRedraw() {
        points = uniquePoints(points);
        points = smooth(points);
        redraw();
        savePoints();
    }

    $("#clear").click(function () {
        clearAll();
    });

    $("#smooth").click(function () {
        smoothAndRedraw();
    });

    $("#pen").click(function () {
        $('#tracearea').css({
            'cursor': 'crosshair'
        });
        mode = "pen";
    });

    $("#constrain-roi").click(function () {
        $('#tracearea').css({
            'cursor': 'url(static/images/roi.cur) 2 -1, crosshair'
        });
        mode = "roi";
    });

    $("#maximize-roi").click(function () {
        resetRoI();
    });

    $("#eraser").click(function () {
        $('#tracearea').css({
            'cursor': 'url(static/images/dotted-line.cur) 2 -1, crosshair'
        });
        mode = "eraser";
        //setButtonActive(this);
    });


    function createObjectURL(object) {
        return URL.createObjectURL(object);
    }

    function changeImg(imagePath) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        currentImage.onload = function () {
            context.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
            // need to do this inside or we'll lose it...
            if (currentImageName in contextPoints) {
                loadPoints();
            }
        };

        currentImage.src = imagePath;
        var width = parseInt(currentImage.width);
        var height = parseInt(currentImage.height);

    }

    function updateName(f) {
        currentImageName = f.name;
        $("#image-name")[0].textContent = f.name;
    }

    function updateIdxNum() {
        $("#image-num")[0].textContent = idx + 1 + " of " + numFiles;
    }

    function deletePoints() {
        points = [];
        if (currentImageName in contextPoints) {
          console.log("deleting points for " + currentImageName);
          delete contextPoints[currentImageName];
        }
    }

    function savePoints() {
      if (!_.isEmpty(points) && files.length > 0) {
          contextPoints[currentImageName] = points;
          console.log("saving " + points.length +" points for "+ currentImageName);
        }
    }

    function loadPoints() {
        if (currentImageName in contextPoints) {
            points = contextPoints[currentImageName];
            redraw();
        }
    }

    function updateImgData(f) {
        console.log("updating image...");
        updateIdxNum();
        updateName(f);
        changeImg(createObjectURL(f));
    }

    function nextImage() {
        points = [];
        if (idx == 0 && numFiles == 0) return alert("No images selected!");
        if (idx + 1 > numFiles - 1) {
            idx = -1;
        }
        var f = files[idx + 1];
        idx += 1;
        updateImgData(f)
    }

    function previousImage() {
        points = [];
        if (idx == 0 && numFiles == 0) return alert("No images selected!");
        if (idx == 0) {
            idx = numFiles;
        }
        var f = files[idx - 1];
        idx -= 1;
        updateImgData(f)
    }

    // Handle image cycling
    $("#advance").on('click', function () {
        nextImage();
    });

    $("#back").on('click', function () {
        previousImage();
    });

    $(document).keydown(function (e) {

        switch (e.which) {
            case 37: // left
                previousImage();
                break; // break or you fall through to the next guy!
            case 39: // right
                nextImage();
                break;
            default:
                return; // ignore other presses
        }
        // prevent the default action
        e.preventDefault();
    });


    function launchModal(prevFiles) {
      console.log("# of Image files: " + imageFiles.length);
      console.log("# of old file names: " + prevFiles.length);

      if (_.isEqual(imageFiles.sort(), prevFiles.sort()) == false) {
        console.log(JSON.stringify(imageFiles) + " != " + JSON.stringify(prevFiles));
        console.log("Launching modal...");
        var missingFiles = prevFiles.join("\n");
        $("#missing-files").text(missingFiles);

        titleText = "Missing " + prevFiles.length + " images";
        console.log(titleText)
        $("#missing-images-title").text(titleText);

        $('#missing-images-modal').modal('show');
      }
    }

    function loadImages(files) {
      imageFiles = _.map(files, function(f){ return f.name; });
      numFiles = files.length;
      console.log(numFiles + " images loaded: " + imageFiles);
      clearAll();
      updateImgData(files[0]);
      redraw();
    }

    function loadTraces(traced) {
      for (imgID in traced) {
        if (!contextPoints.hasOwnProperty(imgID)) {contextPoints[imgID] = traced[imgID]}
      }
      loadPoints();
    }

    // Loading data is a two-step process (because of drop-down button)
    $("#load-image-data").on('click', function() {
      $("#load-images").trigger('click');
    });

    $("#load-images").on('change', function (e) {
        files = Array.prototype.slice.call(this.files);
        loadImages(files);
    });

    $("#load-trace-data").on('click', function() {
      $("#load-traces").trigger('click');
    });

    $("#load-traces").on('change', function (e) {
        //Get first file in files Array
        traceFile = $("#load-traces").prop('files')[0];
        $.getJSON(createObjectURL(traceFile), function(json) {

          // Load roi data
          roi = $.parseJSON(json['roi']);
          console.log("loaded RoI...");
          console.log("roi from file: " + JSON.stringify(roi));

          // Load trace data
          var traced = json['trace-data'];
          loadTraces(traced);

          console.log("traced images: "+ _.size(contextPoints));
          // Load tracer id
          $("#tracer").val(json['tracer-id']);
          // Load subject id
          $("#subject").val(json['subject-id']);
          // Load project id
          $("#project").val(json['project-id']);

          launchModal(Object.keys(traced));
        });
        //TODO: Read json data into script props.
    });

    // Save data
    $("#dump-traces").on('click', function() {
      console.log("saving traces.json...");
      //savePoints();
      var traceData = JSON.stringify(contextPoints);
      var roiData = JSON.stringify(roi);
      $('#roi-data').val(roiData);
      $('#trace-data').val(traceData);
    })

    // Clear previous data
    $("#clear-prev-data").on('click', function() {
      console.log("clearing previously saved data...");
      localStorage.removeItem('trace-data');
      localStorage.removeItem('roi-data');
      localStorage.removeItem('images');
      localStorage.removeItem('tracer-id');
      localStorage.removeItem('subject-id');
      localStorage.removeItem('project-id');
    });


    // Load previous data
    // TODO: fix modal launch (also check when uploading trace data)

    $("#load-prev-data").on('click', function() {

      var oldFileNames = JSON.parse(localStorage.getItem('images'));
      console.log("loading previously saved data for " + oldFileNames.length + " files: " + oldFileNames);

      // Load previous roi data
      oldRoI = JSON.parse(localStorage.getItem('roi-data'));
      if (!$.isEmptyObject(oldRoI)) {
        console.log("previous RoI: " + JSON.stringify(oldRoI));
        roi = oldRoI;
      }
      // Load previous trace data
      console.log("loading previous traces...");
      var oldContextPoints = JSON.parse(localStorage.getItem('trace-data'));
      if (!$.isEmptyObject(oldContextPoints)) {
        loadTraces(oldContextPoints);
        //console.log("contextPoints from last session: " + oldContextPoints);
      }

      // Load form data
      $("#tracer").val(localStorage.getItem('tracer-id'));
      $("#subject").val(localStorage.getItem('subject-id'));
      $("#project").val(localStorage.getItem('project-id'));

      // What images do we need to upload?
      launchModal(oldFileNames);
    });


    // Save current data
    $(window).unload(function(){
      console.log("exiting...");
      if (!$.isEmptyObject(contextPoints) && imageFiles.length > 0) {
        console.log("saving data on exit...");
        //savePoints();
        console.log("saving " + Object.keys(contextPoints).length + " traces: " + Object.keys(contextPoints));
        localStorage.setItem('trace-data', JSON.stringify(contextPoints));
        //console.log('locally stored trace(s): '+ localStorage.getItem('trace-data'));
        localStorage.setItem('roi-data', JSON.stringify(roi));
        localStorage.setItem('images', JSON.stringify(imageFiles));
        localStorage.setItem('tracer-id', $("#tracer").val());
        localStorage.setItem('subject-id', $("#subject").val());
        localStorage.setItem('project-id', $("#project").val());
      }
    });
});
