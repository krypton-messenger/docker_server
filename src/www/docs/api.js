var converter = new showdown.Converter();
const update  =()=>{
    $.ajax("index.md").then(response => {
        html = converter.makeHtml(response);
        apiContent.innerHTML = html;
    });
};
update()
// setInterval(update,5000);