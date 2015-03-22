// Gus Hahn-Powell Dec, 2014
// TODO: add palate pen & points
// TODO: add RoI
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

    var mode = "pen";

    canvas = $("#tracearea")[0];
    context = canvas.getContext("2d");
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

    // start with the pen as active
    //$("#pen")[0].trigger( "click" );
    setButtonActive($("#pen")[0]);

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
            //console.log("attempted to draw RoI... ");

        };

    }

    function withinRoI(point) {
        //displayRoICoords();
        //console.log("x = " + point.x + "\ny = " + point.y)

        return (
        (point.x > roi.srcX) &&
        (point.x < roi.srcX + roi.destX) &&
        (point.y > roi.srcY) &&
        (point.y < roi.srcY + roi.destY)
        )
    }

    function uniquePoints(points) {
        return _.uniq(points, function (newPoint) {return newPoint.x}); // get rid of duplicates.
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
            newPoints = smooth(newPoints);

            _.each(newPoints, function (newPoint) {
                points = _.filter(points, function (oldPoint) {
                    return oldPoint.x != newPoint.x
                });
            });

            points = points.concat(newPoints);
            newPoints = [];
            //points = _.uniq(points.reverse(), function (point) {
            //    return point.x
            //});
            smoothAndRedraw();
            console.log("total points: " + points.length);
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

    function erase(e) {
        toErase = [];
        toErase.push(getMousePos(canvas, e));

        canvas.onmousemove = function (e) {
            toErase.push(getMousePos(canvas, e));
        };

        // we're using an eraser
        function comparePoints(valid, invalid) {
            //console.log("valid x, y:" + valid.x + ", " + valid.y + "\ninvalid x, y: " + invalid.x + ", " + invalid.y);
            return ((Math.abs(invalid.x - valid.x) <= 2) && (Math.abs(invalid.y - valid.y) <= 4)) ? true : false;
        }

        canvas.onmouseup = function () {

            var remainingPoints = [];
            for (var j = 0; j < points.length; j++) {
                var isValid = true;
                var valid = points[j];
                for (var i = 0; i < toErase.length; i++) {
                    var invalid = toErase[i];
                    if (comparePoints(valid, invalid) == true) {
                        isValid = false;
                        break
                    }
                }
                if (isValid == true) {
                    remainingPoints.push(valid);
                }
            }

            points = remainingPoints;
            redraw();
        };
    }

    canvas.onmousedown = function (e) {
        switch (mode) {

            case "pen":
                draw(e);
                break;
            case "roi":
                handleRoI(e);
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

    function smooth(points) {
        if (points.length != 0) {
            points = sortPoints(points);
            var smoothedPoints = [];
            for (var i = 0; i < points.length - 1; i++) {
                var currentPoint = points[i];
                var nextPoint = points[i + 1];
                if (Math.abs(currentPoint.x - nextPoint.y) > 1) {
                    var midPoint = {
                        x: parseInt((currentPoint.x + nextPoint.x) / 2),
                        y: parseInt((currentPoint.y + nextPoint.y) / 2)
                    };
                    smoothedPoints.push(currentPoint);
                    smoothedPoints.push(midPoint);
                } else {
                    smoothedPoints.push(currentPoint);
                }
            }
            smoothedPoints.push(_.last(points));
            points = smoothedPoints;
            // smooth until convergence
            if (smoothed(points) == false) smooth(points);
        }
        return points;
    }

    function smoothAndRedraw() {

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
        setButtonActive(this);
        //setColor(this, '#fff200');
    });

    $("#roi").click(function () {
        $('#tracearea').css({
            'cursor': 'crosshair'
        });
        mode = "roi";
        setButtonActive(this);
        //setColor(this, '#fff200');
    });

    $("#max-roi").click(function () {
        resetRoI();
    });

    $("#eraser").click(function () {
        $('#tracearea').css({
            'cursor': 'url(static/images/circle.cur) 2 -1, crosshair'
        });
        mode = "eraser";
        setButtonActive(this);
        //setColor(this, '#fff200');
    });

    function setButtonActive(btn) {
        // deselect other buttons
        //$(".button").css("background-color","#E3E1B8");
        $("btn-primary").button('toggle');
        //btn.style.backgroundColor = "#9999ff";
    }

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
            if (idx in contextPoints) {
                loadPoints();
            }
        };
        var width = parseInt(lastImage.width);
        var height = parseInt(lastImage.height);

        canvas.width = width;
        canvas.height = height;
        //console.log("loaded " + lastImage.src);
        //console.log("image width: " + width + "\nimage height: " + height);


    }

    function updateName(f) {
        $("#image-name")[0].textContent = f.name;
    }

    function updateIdxNum() {
        $("#image-num")[0].textContent = idx + 1 + " of " + numFiles;
    }

    function deletePoints() {
        points = [];
        if (idx in contextPoints) {
            delete contextPoints[idx];
        }
    }

    function savePoints() {
      if (!_.isEmpty(points)) {
        contextPoints[idx] = points;
        if (files.length > 0) {
          var fname = files[idx].name;
          tracedFiles[fname] = points;
          console.log("file: " + fname);
        }
      }
    }

    function loadPoints() {
        if (idx in contextPoints) {
            points = contextPoints[idx];
            redraw();
        }
    }

    function updateImgData(f) {
        updateIdxNum();
        changeImg(createObjectURL(f));
        updateName(f);
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
        //console.log("numFiles: "+numFiles + "\nidx: "+ idx);
        updateImgData(f)
    }

    $('#tracer-id').focus(function () {
        var tracerID = $("#tracer-id");

        tracerID.css("background", "white");
        tracerID.val('');
        tracerID.css("text-align", "left");

        tracerID.keypress(function (e) {
            if (e.which == 13) {
                tracerID.blur();
                // change style
                tracerID.css("background", "lavender");
                tracerID.css("text-align", "center");
            }
        });
    });

    $("#image-files").on('change', function (e) {
        files = Array.prototype.slice.call(this.files);
        numFiles = files.length;
        clearAll();
        console.log(numFiles + " loaded...");
        updateImgData(files[0]);
    });

    // A terrible hack to trigger a file download...
    $("#dump-traces").on('click', function() {
      savePoints();
      // add tracer $("#tracer-id")
      var traceData = JSON.stringify(tracedFiles);
      console.log(traceData);

      $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: 'text',
        //dataType: "json",
        url: "/trace-data",
        data: traceData,
        success: function (response) {
          console.log("success!");
          window.open(response, 'Download');
          //return response
        },
      });
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

//JSON.stringify(contextPoints, undefined, 2);
