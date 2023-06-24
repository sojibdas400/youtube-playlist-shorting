$(document).ready(function() {
    $('#sort-button').click(function() {
        var playlistUrl = $('#playlist-input').val();
        if (playlistUrl) {
            var playlistId = extractPlaylistId(playlistUrl);
            $.ajax({
                url: 'https://www.googleapis.com/youtube/v3/playlistItems',
                dataType: 'json',
                data: {
                    part: 'snippet',
                    maxResults: 50,
                    playlistId: playlistId,
                    key: 'AIzaSyDjieCRye5T3oMUGna3uE9fqZ6XQMemtXU'
                },
                success: function(response) {
                    var playlistData = [];
                    var videoIds = []; // Store video IDs to fetch video length
                    
                    $.each(response.items, function(index, item) {
                        var videoData = item.snippet;
                        playlistData.push({
                            title: '<a href="https://www.youtube.com/watch?v=' + videoData.resourceId.videoId + '" target="_blank">' + videoData.title + '</a>',
                            uploadDate: videoData.publishedAt,
                            videoId: videoData.resourceId.videoId,
                            likes: 0, // Retrieve likes count using YouTube API
                            comments: 0 // Retrieve comments count using YouTube API
                        });
                        videoIds.push(videoData.resourceId.videoId); // Add video ID to fetch video length
                    });
                    
                    // Fetch video length using YouTube API
                    $.ajax({
                        url: 'https://www.googleapis.com/youtube/v3/videos',
                        dataType: 'json',
                        data: {
                            part: 'contentDetails',
                            id: videoIds.join(','),
                            key: 'AIzaSyDjieCRye5T3oMUGna3uE9fqZ6XQMemtXU'
                        },
                        success: function(response) {
                            $.each(response.items, function(index, item) {
                                var videoId = item.id;
                                var duration = item.contentDetails.duration;
                                var videoLength = parseISO8601Duration(duration);
                                playlistData[index].videoLength = videoLength;
                            });

                            $('#playlist-table').DataTable({
                                data: playlistData,
                                columns: [
                                    { data: 'title', orderable: false },
                                    { data: 'uploadDate' },
                                    { data: 'videoLength' },
                                    { data: 'likes' },
                                    { data: 'comments' }
                                ]
                            });
                        },
                        error: function(xhr, status, error) {
                            console.log('Error: ' + error);
                        }
                    });
                },
                error: function(xhr, status, error) {
                    console.log('Error: ' + error);
                }
            });
        }
    });
});

function extractPlaylistId(url) {
    var playlistId = '';
    if (url.includes('list=')) {
        var regex = /[?&]list=([^&#]*)/i;
        var match = regex.exec(url);
        if (match && match[1]) {
            playlistId = match[1];
        }
    } else if (url.includes('/playlist?list=')) {
        var parts = url.split('/playlist?list=');
        if (parts.length > 1) {
            playlistId = parts[1].split('&')[0];
        }
    } else if (url.includes('/watch?')) {
        var parts = url.split('/watch?');
        if (parts.length > 1) {
            var queryParams = new URLSearchParams(parts[1]);
            playlistId = queryParams.get('list');
        }
    }
    return playlistId;
}

function parseISO8601Duration(duration) {
    var match = duration.match(/P(\d+Y)?(\d+W)?(\d+D)?T(\d+H)?(\d+M)?(\d+S)?/);

    var years = parseInt(match[1]) || 0;
    var weeks = parseInt(match[2]) || 0;
    var days = parseInt(match[3]) || 0;
    var hours = parseInt(match[4]) || 0;
    var minutes = parseInt(match[5]) || 0;
    var seconds = parseInt(match[6]) || 0;

    var totalMinutes = years * 365 * 24 * 60 +
        weeks * 7 * 24 * 60 +
        days * 24 * 60 +
        hours * 60 +
        minutes +
        Math.round(seconds / 60);

    return Math.floor(totalMinutes / 60) + 'h ' + (totalMinutes % 60) + 'm';
}
