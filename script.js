$(document).ready(function () {
    const $videoTable = $("#videoTable");
    const $searchForm = $("#searchForm");
    const $searchInput = $("#searchInput");
    const $dateFrom = $("#dateFrom");
    const $dateTo = $("#dateTo");

    const table = $videoTable.DataTable({
        lengthMenu: [10, 50, 100, 1000],
    });

    $searchForm.submit(function (event) {
        event.preventDefault();

        const searchQuery = $searchInput.val();
        const dateFrom = $dateFrom.val();
        let dateTo = $dateTo.val();

        const apiParams = {
            part: "snippet",
            q: searchQuery,
            key: "AIzaSyDjieCRye5T3oMUGna3uE9fqZ6XQMemtXU",
            maxResults: 10000,
        };

        if (dateFrom) {
            apiParams.publishedAfter = dateFrom + "T00:00:00Z";
        }

        if (!dateTo) {
            dateTo = new Date().toISOString().split("T")[0];
        }
        apiParams.publishedBefore = dateTo + "T23:59:59Z";

        $.get(
            "https://www.googleapis.com/youtube/v3/search",
            apiParams,
            function (data) {
                table.clear().draw();

                data.items.forEach((item) => {
                    const videoId = item.id.videoId;
                    const title = item.snippet.title;
                    const uploadDate = item.snippet.publishedAt;

                    const videoLink = `<a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">${title}</a>`;

                    $.get(
                        "https://www.googleapis.com/youtube/v3/videos",
                        {
                            part: "contentDetails,statistics",
                            id: videoId,
                            key: "AIzaSyDjieCRye5T3oMUGna3uE9fqZ6XQMemtXU",
                        },
                        function (videoData) {
                            const duration = parseVideoDuration(
                                videoData.items[0].contentDetails.duration
                            );
                            const likesCount =
                                videoData.items[0].statistics.likeCount;
                            const viewsCount =
                                videoData.items[0].statistics.viewCount;

                            table.row
                                .add([
                                    videoLink,
                                    duration,
                                    uploadDate,
                                    likesCount,
                                    viewsCount,
                                ])
                                .draw();

                            const videoRating =
                                videoData.items[0].statistics.averageRating;
                            const rowIndex = table
                                .column(0)
                                .data()
                                .indexOf(videoLink);
                            if (rowIndex >= 0) {
                                table.cell(rowIndex, 4).data(videoRating);
                                table.draw();
                            }
                        }
                    );
                });
            }
        );
    });
});

// function parseVideoDuration(duration) {
//     const matches = duration.match(/[0-9]+[HMS]/g);
//     let seconds = 0;

//     matches.forEach((part) => {
//         const unit = part.charAt(part.length - 1);
//         const value = parseInt(part.slice(0, -1));

//         if (unit === "H") {
//             seconds += value * 3600;
//         } else if (unit === "M") {
//             seconds += value * 60;
//         } else if (unit === "S") {
//             seconds += value;
//         }
//     });

//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     let formattedDuration = "";

//     if (hours > 0) {
//         formattedDuration += hours + "h ";
//     }
//     if (minutes > 0) {
//         formattedDuration += minutes + "m ";
//     }
//     formattedDuration += (seconds % 60) + "s";

//     return formattedDuration;
// }
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
