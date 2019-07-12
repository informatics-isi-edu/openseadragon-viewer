function AnnotationList(parent){

    var _self = this;
    
    this.elem = null;
    this.collection = {};
    this.parent = parent || null;
    this.selectingId = null;

    // Add new annotation items
    this.add = function(items){
        var id,
            item,
            i;
            
        for(i = 0; i < items.length; i++){
            id = items[i].id;

            if(!this.collection.hasOwnProperty(id)){
                item = new AnnotationItem({
                    id : id,
                    anatomy : items[i].anatomy,
                    description : items[i].description,
                    parent : this
                });
                
                this.collection[id] = item;
    
                if(this.elem != null){
                    item.render();
                    this.elem.querySelector(".groups").appendChild(item.elem);
                };
            }
        }
    }

    // Adjust item location in the scroll view
    this.adjustScrollView = function(elem){
        var clientHeight = elem.parentNode.clientHeight,
            scrollTop = elem.parentNode.scrollTop,
            elemOffsetTop = elem.offsetTop,
            elemScrollHeight = elem.scrollHeight;
        
        // element is above the scrollbar location
        if(scrollTop > (elemOffsetTop + elemScrollHeight)){
            elem.parentNode.scrollTop = elemOffsetTop;
        }
        // element is below the scrollbar location
        else if((scrollTop + clientHeight) < elemOffsetTop){
            elem.parentNode.scrollTop = elemOffsetTop;
        }
    }

    // Change the selecting annotation item
    this.changeSelectingAnnotation = function(annotationId){
        
        var item;
    
        // remove style from the previous selected one
        if(this.collection.hasOwnProperty(this.selectingId)){
            item = this.collection[this.selectingId];
            item.isSelected = false;
            item.changeSelectedStyle();
        };

        // add current style to the new one
        if(this.collection.hasOwnProperty(annotationId)){
            item = this.collection[annotationId];
            item.isSelected = true;
            item.changeSelectedStyle();
            this.adjustScrollView(item.elem);
        };
        
        this.dispatchEvent('ChangeSelectingAnnotation', {
            id : annotationId
        });
        
        this.selectingId = annotationId;
    }
    
    // Dispatch the event to the parent
    this.dispatchEvent = function(type, data){
        switch(type){
            default:
                this.parent.dispatchEvent(type, data);
                break;
        }
        
    }

    // Hide annotations
    this.hideAll = function(){
        _self.elem.querySelector(".overlayDisplayBtn[data-type='none']").click();
    }

    // Show annotations
    this.showAll = function(){
        _self.elem.querySelector(".overlayDisplayBtn[data-type='all']").click();
    }

    // Update the annotation number 
    this.updateDisplayNumber = function(){
        var listLength = this.elem.querySelectorAll(".groups .annotationItem").length;
        var total = Object.keys(this.collection).length;
        this.elem.querySelector(".resultCount").innerHTML = [
            "<span>Displaying "+listLength+" of "+total+" Annotations</span>"
        ].join("");
    }

    // Update annotation list
    this.updateList = function(data){
        this.add(data);
        this.updateDisplayNumber();
    }

    // Search annotation item that has matched keyword in its anatomy 
    this.onKeyupSearch = function(){

        var keyword = this.value.toLowerCase() || "",
            id;
        
        _self.elem.querySelector(".groups").innerHTML = "";

        for(id in _self.collection){
            if(_self.collection[id].anatomy.toLowerCase().indexOf(keyword) >= 0 || keyword == ""){
                _self.elem.querySelector(".groups").append(_self.collection[id].elem);
            }
        }

        _self.updateDisplayNumber();
    };

    // Click to create a new annotation
    this.onClickNewAnnotation = function(){
        _self.parent.dispatchEvent('CreateNewAnnotationGroup');
    };

    // Click to toggle overlay visibility in Openseadragon
    this.onClickOverlayVisibility = function(){
        // Get overlay toggle button type clicked by the user
        var displayType = this.getAttribute("data-type") || "",
            isDisplay = (displayType == "all") ? true : false,
            id,
            item;

        _self.elem.querySelector(".overlayDisplayBtn[data-type='all']").className = (displayType == "all") ? "overlayDisplayBtn selected" : "overlayDisplayBtn";
        _self.elem.querySelector(".overlayDisplayBtn[data-type='none']").className = (displayType == "none") ? "overlayDisplayBtn selected" : "overlayDisplayBtn";
         
        for(id in _self.collection){
            item = _self.collection[id];
            item.isDisplay = isDisplay;
            item.isFlagShown = isDisplay;
            item.updateMenuIconClass();
        };

        _self.parent.dispatchEvent('ChangeOverlayVisibility', {
            isDisplay : isDisplay
        });
    }

    // Remove annotation item
    this.remove = function(id){

        if(this.collection.hasOwnProperty(id)){
            delete this.collection[id];

            // Notify Viewer to remove the annotation
            this.parent.dispatchEvent('RemoveAnnotation', {
                id : id
            });

            // Update the number of list
            this.updateDisplayNumber();
        };
    }

    // Render the view 
    this.render = function(){

        var id,
            collection = this.collection,
            listLength = Object.keys(collection).length || 0,
            listElem = document.createElement("div"),
            isOverlayVisible = this.parent.getOsdOverlayVisibility();

        listElem.setAttribute("class", "annotationList");
        listElem.innerHTML = [
            "<span class='title'>Annotations</span>",
            "<span class='row' data-type='overlayVisibility'>",
                "<span class='overlayDisplayBtn' data-type='all'>Show All</span>",
                "<span class='overlayDisplayBtn' data-type='none'>Hide All</span>",
            "</span>",
            // "<div class='addAnnotationGroupBtn'>",
            //     "<span><i class='fas fa-plus'></i>New Annotation</span>",
            // "</div>",
            "<div class='searchBar'>",
                "<input type='text' class='search' placeholder='Search' />",
            "</div>",
            "<span class='resultCount'>",
                "<span>Displaying "+listLength+" Annotations</span>",
            "</span>",
            "<div class='groups'>",
            "</div>"
        ].join("");

        for(id in collection){
            if(collection[id].elem == null){
                collection[id].render();
            }
            listElem.querySelector(".groups").appendChild(collection[id].elem);
            collection[id].changeSelectedStyle();
        }

        this.elem = listElem;
        this.elem.querySelector(".searchBar input.search").addEventListener('keyup', this.onKeyupSearch);
        
        // Change the overlay visibility button style
        this.elem.querySelector(".overlayDisplayBtn[data-type='all']").className = (isOverlayVisible) ? "overlayDisplayBtn selected" : "overlayDisplayBtn";
        this.elem.querySelector(".overlayDisplayBtn[data-type='none']").className = (!isOverlayVisible) ? "overlayDisplayBtn selected" : "overlayDisplayBtn";

        // Binding events
        // this.elem.querySelector(".addAnnotationGroupBtn").addEventListener('click', this.onClickNewAnnotation);
        this.elem.querySelectorAll(".overlayDisplayBtn").forEach(function(elem){
            elem.addEventListener('click', this.onClickOverlayVisibility);
        }.bind(this));
    }
}





