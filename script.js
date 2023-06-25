$(document).ready(function () {
    // Initialize DataTable
    var table = $("#videoTable").DataTable({
        lengthMenu: [10, 25, 50, 75, 100, 250, 500, 1000],
    });
    // Event handler for the form submission
    $("#searchForm").submit(function (event) {
        event.preventDefault();

        // Get user input
        var searchQuery = $("#searchInput").val();
        var dateFrom = $("#dateFrom").val();
        var dateTo = $("#dateTo").val();
        var apiKey = $("#apiKey").val();

        if (!apiKey) {
            apiKey = "AIzaSyCE-3a0xnoM8lVjmojr8TAMpaEl94mEPag";
        }

        // Build the API request parameters
        var apiParams = {
            part: "snippet",
            q: searchQuery,
            key: apiKey,
            maxResults: 1000, // Change the number to the desired maximum results
        };

        if (dateFrom) {
            apiParams.publishedAfter = dateFrom + "T00:00:00Z";
        }

        // Set dateTo to today's date if not provided
        if (!dateTo) {
            var today = new Date();
            dateTo = today.toISOString().split("T")[0];
        }
        apiParams.publishedBefore = dateTo + "T23:59:59Z";

        // Make API request to search for videos
        $.get(
            "https://www.googleapis.com/youtube/v3/search",
            apiParams,
            function (data) {
                // Clear existing table data
                table.clear().draw();

                // Process search results
                data.items.forEach(function (item) {
                    var videoId = item.id.videoId;
                    var title = item.snippet.title;
                    var uploadDate = item.snippet.publishedAt;

                    // Create a link to the video
                    var videoLink =
                        '<a href="https://www.youtube.com/watch?v=' +
                        videoId +
                        '" target="_blank">' +
                        title +
                        "</a>";

                    // Make API request to retrieve video details
                    $.get(
                        "https://www.googleapis.com/youtube/v3/videos",
                        {
                            part: "contentDetails,statistics",
                            id: videoId,
                            key: apiKey,
                        },
                        function (videoData) {
                            console.log(videoData);
                            // Extract video duration
                            var duration =
                                videoData.items[0].contentDetails.duration;
                            var videoLength = parseVideoDuration(duration);

                            // Extract video likes count
                            var likesCount =
                                videoData.items[0].statistics.likeCount;
                            var viewssCount =
                                videoData.items[0].statistics.viewCount;

                            // Create a row for each video
                            table.row
                                .add([
                                    videoLink,
                                    videoLength,
                                    uploadDate,
                                    likesCount,
                                    viewssCount,
                                ])
                                .draw();

                            // Make API request to retrieve video statistics for rating
                            $.get(
                                "https://www.googleapis.com/youtube/v3/videos",
                                {
                                    part: "statistics",
                                    id: videoId,
                                    key: apiKey,
                                },
                                function (statData) {
                                    // Extract video rating
                                    var videoRating =
                                        statData.items[0].statistics
                                            .averageRating;

                                    // Update the rating column in the DataTable
                                    var rowIndex = table
                                        .column(0)
                                        .data()
                                        .indexOf(videoLink);
                                    if (rowIndex >= 0) {
                                        table
                                            .cell(rowIndex, 4)
                                            .data(videoRating);
                                        table.draw();
                                    }
                                }
                            );
                        }
                    );
                });
            }
        );
    });
});

// Function to parse the video duration from ISO 8601 format
function parseVideoDuration(duration) {
    const matches = duration.match(/[0-9]+[HMS]/g);
    let hours = 0;

    matches.forEach((part) => {
        const unit = part.charAt(part.length - 1);
        const value = parseInt(part.slice(0, -1));

        if (unit === "H") {
            hours += value;
        } else if (unit === "M") {
            hours += value / 60;
        } else if (unit === "S") {
            hours += value / 3600;
        }
    });

    return hours.toFixed(2) + "h";
}
