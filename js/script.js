const commentList = document.querySelector('.comments-list');
const delPopup = document.querySelector('.confirm-popup');
const confirmDel = document.querySelector('.confirm-del');
const cancelDel = document.querySelector('.cancel-del');
let typing = "comment";

let currentTime;
let currentUser = {};
let comments = [];
let form;
let commentSubmit;

async function fetchData(){
	try{
		let response = await fetch("data.json");

		
		if(localStorage.getItem("comments") == null){
			let data = await response.json();
			localStorage.setItem("comments", JSON.stringify(data.comments));
			localStorage.setItem("currentUser", JSON.stringify(data.currentUser));
		}
		
		comments = JSON.parse(localStorage.getItem("comments"));
		currentUser = JSON.parse(localStorage.getItem("currentUser"));

	}catch(e){
		console.error(e.message);
	}	
}

function fetchComment(id){
	for( let cmt of comments){
		if(cmt.id === id){
			return cmt;
		}else{
			for(let reply of cmt.replies){
				if(reply.id === id){
					return reply;
				}
			}
		}
	}
}
async function main(){
	try{
		await fetchData();
		currentTime = Date.now();
		typing = "comment";

		commentList.innerHTML = "";
		form = "comment-form";
		 for(let comment of comments){
			renderComment(comment, commentList, false);
		};

		commentList.append(mainForm());
		const btnReply = document.querySelectorAll('.btnReply');
		
		btnReply.forEach((btn) => {
			btn.addEventListener('click', replyForm);
		});
		
		commentSubmit = document.querySelector(".submit-"+form);
		commentSubmit.addEventListener('click', addComment);

		const commentEdit = document.querySelectorAll('.edit-comment');
		commentEdit.forEach((btn) => {btn.addEventListener('click', editComment)});
		const commentDel = document.querySelectorAll('.del-comment');
		commentDel.forEach((btn) => {btn.addEventListener('click', confirmDelete)});
		cancelDel.addEventListener('click', () => delPopup.classList.toggle("hidden"));
		const score = document.querySelectorAll(".fa-plus, .fa-minus");
		score.forEach( btn => btn.addEventListener('click', updateScore));
	}catch(e){
		console.error(e.message);
	}
}

function renderComment(comment, commentBox, isReply){
	commentBox.innerHTML += `<div class="card flex ${ isReply ? "reply" : ""}" id="${comment.id}">
		<div class="flex actions-container">		
			<div class="card__score flex">
				<i class="fas fa-plus"></i>
				<div>${comment.score}</div>
				<i class="fas fa-minus"></i>
			</div>
			<div class="actions-side">
				${actionButtons(comment)}	
			</div>
		</div>
		<div class="card__comment">
			<div class="comment-meta flex">
				<div class="user flex">${userData(comment)}</div>
				<div class="actions">
					${actionButtons(comment)}
				</div>
			</div>
			<div class="comment flex"><p>${ isReply ? "<span class=\"replied-user\">@"+comment.replyingTo+"</span>" : ""} ${comment.content}</p></div>
		</div>
	</div>`;

	if(comment.replies !== undefined){
		const replyBox = document.createElement("div");
		replyBox.classList.add("replyBox", "flex");
		for(let reply of comment.replies){
			renderComment(reply, replyBox, true);
		}
		commentBox.innerHTML += `${replyBox.outerHTML}`;
	}
}
function userData(comment){
	return `<img src=\"${comment.user.image.png}\"> 
	 <span class="comment-user">${comment.user.username}</span>
	 ${comment.user.username === currentUser.username ? "<span class=\"you\">You</span>" : ""} 
	 <span class="date">${elapsedTime(comment.createdAt)}</span>`;
}

function actionButtons(comment){
	if(comment.user.username === currentUser.username){
		return `<a href="#" class="del-comment"><i class="fas fa-trash"> </i> Delete</a>&ensp;<a href="#" class="edit-comment"><i class="fas fa-pen"> </i> Edit</a>`;
	}else{
		return `<a href="#" id="${comment.id}" class=\"btnReply\"><i class="fas fa-reply"></i> reply</a>`;
	}
}

function mainForm(id){
	const div = document.createElement('div');
	div.classList.add(form, "flex", "card");
	div.id = id !== undefined ? id : "new-comment";

	div.innerHTML = `<img src="${currentUser.image.png}" alt="" class="user-avatar">
			<textarea name="comment-form" id="${typing}Text" rows="3" placeholder="Add a ${typing}..."></textarea>
			<div class="flex form-after"><img src="${currentUser.image.png}" alt="" class="user-avatar-below">
			<button  class="submit-${form}">${form === "comment-form" ? "Send" : "Reply"}</button></div>`;
	return div;
}

function replyForm(e){
	if(typing !== "comment"){
		return;
	}

	typing = "reply";
	let commentCard = e.target.closest('.card');
	form = commentCard.classList.contains("reply") ? "reply-form" : "comment-reply";
	let id = commentCard.id;

	commentCard.after(mainForm(id));
	commentSubmit = document.querySelector(".submit-"+form);
	commentSubmit.addEventListener('click', addComment);
}

function addComment(e){
	if(e.target.classList.contains("submit-comment-form") && typing !== "comment"){
		return;
	}

	let allComments = comments.reduce((previousValue, currentValue) => [...previousValue, ...currentValue.replies], comments);

	let recentComment = allComments.reduce(compareID);
	let nextID = recentComment.id + 1;

	const commentText = document.querySelector('#'+typing+'Text');
	let commentCard = e.target.closest(".card");

	if(commentText.value !== ""){
		let comment = {};
		
		comment.id = nextID;
		comment.content = commentText.value;
		comment.createdAt = Date.now();
		comment.score = 0;
		comment.user = { 
			image: {
				png: currentUser.image.png, 
				webp: currentUser.image.webp
			},
				username: currentUser.username
		};

		if(commentCard.id === "new-comment"){
			comment.replies = [];
			comments.push(comment);
		}else{
			const cmt = fetchComment(Number(commentCard.id));
			comment.replyingTo = cmt.user.username;
			if(cmt.replies === undefined){
				for (let com of comments){
					let index = com.replies.indexOf(cmt)
					if(index !== -1){
						com.replies.push(comment);
					}
				}
			}else{
				cmt.replies.push(comment);	
			}
		}

		commentText.value = "";
		persistComments();
		main();
	}else{
		alert("comment field cannot be empty");
	}
}

function compareID(p, c){
	if(p.id < c.id){
		return c;
	}else{
		return p;
	}
}

function persistComments(){
	localStorage.removeItem("comments");
	localStorage.setItem("comments", JSON.stringify(comments));
}

function confirmDelete(e){
	let commentCard = e.target.closest(".card");
	const id = commentCard.id;
	delPopup.classList.remove("hidden");

	confirmDel.id = id;
	confirmDel.addEventListener('click', removeComment);
}

function removeComment(e){
	const id = Number(e.target.id);

	const cmt = fetchComment(id);
	let index = comments.indexOf(cmt);

	if(index !== -1){
		comments.splice(index, 1);
	}else{
		for (let comment of comments){
			index = comment.replies.indexOf(cmt);
			if(index !== -1){
				comment.replies.splice(index, 1);
			}
		}
	}
	delPopup.classList.toggle("hidden");
	persistComments();
	main();
}

function editComment(e){
	if(typing !== ""){
		return;
	}
	typing = "editing";
	let commentCard = e.target.closest(".card");
	let commentContent = commentCard.querySelector("p");
	let textarea = document.createElement("textarea");
	textarea.name = "commentEdit";
	textarea.id = "comment-editor";
	textarea.rows = 3;
	commentContent.replaceWith(textarea);
	let btnUpdate = document.createElement("button");
	btnUpdate.textContent = "Update";
	textarea.after(btnUpdate);

	const cmt = fetchComment(Number(commentCard.id));
	textarea.value = cmt.content;
	textarea = document.querySelector("#comment-editor");
	
	btnUpdate.addEventListener('click', () => {
		if(textarea.value === ""){
			alert("Comment cannot be empty");
			return;
		}
		cmt.content = textarea.value;
		persistComments();
		main();
	});
	e.target.style.opacity = 0.5;
}

function updateScore(e){
	let increment = 1;
	let commentCard = e.target.closest(".card");

	if(e.target.classList.contains("fa-minus")){
		increment = -1;
	}

	const cmt = fetchComment(Number(commentCard.id));
	cmt.score += increment;

	persistComments();
	main();
}

function elapsedTime(startime){
	elapsedSeconds = Math.floor((currentTime - startime)/1000);

	let unit = "Seconds";
	let elapsed = elapsedSeconds;

		let minutes = Math.floor(elapsedSeconds/60);
		let hours = Math.floor(elapsedSeconds/3600);
		let days = Math.floor(hours/24);
		let weeks = Math.floor(days/7);
		let months = Math.floor(days/30);

		if(minutes >= 1 && hours < 1){
			unit = `Minute${minutes > 1 ? "s" : ""}`;
			elapsed = minutes;
		}else if(hours >= 1 && days < 1){
			unit = `Hour${hours > 1 ? "s" : ""}`;
			elapsed = hours;
		}else if(days >= 1 && weeks < 1){
			unit = `Day${days > 1 ? "s" : ""}`;
			elapsed = days;
		}else if(weeks >= 1 && months < 1){
			unit = `Weeks${weeks > 1 ? "s" : ""}`;
			elapsed = weeks;
		}else if(weeks >= 1){
			unit = `Month ${months > 1 ? "s" : ""}`;
			elapsed = months;
		}
		
		return `${elapsed} ${unit} ago`;

}

main();
