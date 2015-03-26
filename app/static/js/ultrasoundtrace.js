// Gus Hahn-Powell Dec, 2014
// TODO: add palate pen & points

// Added button glyphs, arrow key actions & automatic smoothing
$(window).load(function () {
    // avoid the circa 1990 look while loading...
    $(".loader").fadeOut("slow");
    var files = [];
    var idx = 0;
    var numFiles = files.length;
    var lastImage = new Image();
    var points = [];
    var newPoints = [];
    var contextPoints = {};
    var tracedFiles = {};
    var imageFiles = [];
    var currentImageName = "";

    var mode = "pen";

    canvas = $("#tracearea")[0];
    context = canvas.getContext("2d");
    // after canvas has been defined...
    var roi = maximizeRoI();
    displayRoICoords();
    //context.setLineDash([10]);

    function setPenContext() {
        context.lineWidth = 2.5;
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.strokeStyle = '#ff0000'; // red
    }

    function setRoIContext() {
        context.lineWidth = 4;
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.strokeStyle = "#0000FF"; // blue
    }

    // Run this after the context has been set
    changeImg("static/images/frame-0014430.png");

    var roi = maximizeRoI();

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
                var coords = getMousePos(canvas, e);
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
                if (withinRoI(coords) == true) {
                    //var previous = _.last(newPoints);
                    newPoints.push(coords);
                    context.lineTo(coords.x, coords.y);
                    context.stroke();
                }
                else {
                    console.log("point outside of RoI!")
                }
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
            console.log("total points: " + points.length);
            console.log("current points: " + JSON.stringify(points));
        };
    }

    // connect the dots!
    function redraw() {
        clear();
        drawRoI();
        setPenContext();
        filterPoints();
        points = sortPoints(points);
        for (var i = 0; i < points.length - 1; i++) {
            var point = points[i];
            var nextPoint = points[i + 1];

            context.beginPath();
            context.moveTo(point.x, point.y);
            context.lineTo(nextPoint.x, nextPoint.y);
            context.stroke();
        }
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
        context.drawImage(lastImage, 0, 0);
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
            'cursor': 'crosshair'
        });
        mode = "roi";
    });

    $("#maximize-roi").click(function () {
        resetRoI();
    });

    $("#eraser").click(function () {
        $('#tracearea').css({
            'cursor': 'url(static/images/circle.cur) 2 -1, crosshair'
        });
        mode = "eraser";
        //setButtonActive(this);
    });


//};

    function createObjectURL(object) {
        return URL.createObjectURL(object);
    }

    function changeImg(imagePath) {
        context.clearRect(0, 0, canvas.width, canvas.height);

        lastImage.src = imagePath;

        lastImage.onload = function () {
            context.drawImage(lastImage, 0, 0);
            // need to do this inside or we'll lose it...
            if (currentImageName in contextPoints) {
                loadPoints();
            }
        };
        var width = parseInt(lastImage.width);
        var height = parseInt(lastImage.height);

        canvas.width = width;
        canvas.height = height;

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
            delete contextPoints[currentImageName];
        }
    }

    function savePoints() {
      if (!_.isEmpty(points)) {
        contextPoints[currentImageName] = points;
        if (files.length > 0) {
          //var fname = files[idx].name;
          //tracedFiles[fname] = points;
          console.log("file: " + currentImageName);
        }
      }
    }

    function loadPoints() {
        if (currentImageName in contextPoints) {
            points = contextPoints[currentImageName];
            redraw();
        }
    }

    function updateImgData(f) {
        updateIdxNum();
        updateName(f);
        changeImg(createObjectURL(f));
    }

    function nextImage() {
        savePoints();
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
        savePoints();
        points = [];
        if (idx == 0 && numFiles == 0) return alert("No images selected!");
        if (idx == 0) {
            idx = numFiles;
        }
        var f = files[idx - 1];
        idx -= 1;
        updateImgData(f)
    }

    $("#load-image-data").on('click', function() {
      $("#load-images").trigger('click');
    });

    $("#load-images").on('change', function (e) {
        files = Array.prototype.slice.call(this.files);
        imageFiles = _.map(files, function(f){ return f.name; });
        console.log("images: " + imageFiles);
        numFiles = files.length;
        clearAll();
        console.log(numFiles + " loaded...");
        updateImgData(files[0]);
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
          displayRoICoords();
          //console.log("roi from file: " + roi)
          // drawRoI();

          // Load trace data
          var traced = json['trace-data'];
          for (imgID in traced) {
            if (!contextPoints.hasOwnProperty(imgID)) {contextPoints[imgID] = traced[imgID]}
          }
          loadPoints();
          console.log("# traced images: "+ _.size(contextPoints));
          console.log("traced images: "+ _.size(contextPoints));
          // Load tracer id
          $("#tracer").val(json['tracer-id']);
          // Load subject id
          $("#subject").val(json['subject-id']);
          // Load project id
          $("#project").val(json['project-id']);
        });
        //TODO: Read json data into script props.
    });

    // A terrible hack to trigger a file download...
    $("#dump-traces").on('click', function() {
      savePoints();
      // add tracer $("#tracer-id")
      var traceData = JSON.stringify(contextPoints);
      var roiData = JSON.stringify(roi);
      $('#roi-data').val(roiData);
      console.log(traceData);
      $('#trace-data').val(traceData);
      console.log($('#trace-data').val())

    });

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
});
