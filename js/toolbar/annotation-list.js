function AnnotationList(parent){

    var _self = this;
    
    
    this.collection = {};
    this.elem = null;
    this.parent = parent || null;
    this.svgIDs = [];
    this.selectingID = null;
    this.isDisplayAll = true;

    // Add new annotation items
    this.add = function(items){
        var id,
            item,
            i,
            svgID;
            
        for(i = 0; i < items.length; i++){
            id = items[i].groupID;
            svgID = items[i].svgID;

            if(this.svgIDs.indexOf(svgID) == -1){
                this.svgIDs.push(svgID);
            }

            if(!this.collection.hasOwnProperty(id)){
                item = new AnnotationItem({
                    id : id,
                    svgID : svgID,
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
    this.changeSelectingAnnotation = function(data){
        
        var item;
        
        if(this.selectingID == data.groupID){
            if(this.collection.hasOwnProperty(this.selectingID)){
                item = this.collection[this.selectingID];
                item.isSelected = false;
                item.changeSelectedStyle();
            };
            this.selectingID = "";
        }
        else{
            // remove style from the previous selected one
            if(this.collection.hasOwnProperty(this.selectingID)){
                item = this.collection[this.selectingID];
                item.isSelected = false;
                item.changeSelectedStyle();
            };

            // add current style to the new one
            if(this.collection.hasOwnProperty(data.groupID)){
                item = this.collection[data.groupID];
                item.isSelected = true;
                item.changeSelectedStyle();
                this.adjustScrollView(item.elem);
            };
                    
            this.selectingID = data.groupID;
        }
        
    }
    
    // Dispatch the event to the parent
    this.dispatchEvent = function(type, data){
        switch(type){
            case "highlightAnnotation":
                this.changeSelectingAnnotation(data);
                this.parent.dispatchEvent(type,data);
                break;
            default:
                this.parent.dispatchEvent(type, data);
                break;
        }
        
    }

    this.getIconClass = function(type){

        switch(type){
            case "displayAll":
                return (this.isDisplayAll) ? 'fa fa-check-square-o' : 'fa fa-square-o';
            case "displayNone":
                return (!this.isDisplayAll) ? 'fa fa-check-square-o' : 'fa fa-square-o';
        }
    }

    // Hide annotations
    this.hideAll = function(){
        _self.elem.querySelector(".displayAllBtn[data-type='none']").click();
    }

    // Show annotations
    this.showAll = function(){
        _self.elem.querySelector(".displayAllBtn[data-type='all']").click();
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

    // Click to toggle overlay visibility in Openseadragon
    this.onClickChangeAllVisibility = function(){
        // Get overlay toggle button type clicked by the user
        var displayType = this.getAttribute("data-type") || "",
            i,
            id,
            item;
        
        _self.isDisplayAll = (displayType == "all") ? true : false;

        _self.elem.querySelector(".displayAllBtn[data-type='all'] i").className = _self.getIconClass('displayAll');
        _self.elem.querySelector(".displayAllBtn[data-type='none'] i").className = _self.getIconClass('displayNone');
         
        for(id in _self.collection){
            item = _self.collection[id];
            item.isDisplay = _self.isDisplayAll;
            item.updateMenuIconClass();
        };

        for(i = 0; i < _self.svgIDs.length; i++){
            _self.parent.dispatchEvent('changeAllVisibility', {
                svgID : _self.svgIDs[i],
                isDisplay : _self.isDisplayAll
            });
        }
        
    }

    // Render the view 
    this.render = function(){

        var id,
            collection = this.collection,
            listLength = Object.keys(collection).length || 0,
            listElem = document.createElement("div");

        listElem.setAttribute("class", "annotationList");
        listElem.innerHTML = [
            "<span class='title'>Annotations</span>",
            "<span class='row filter' data-type='overlayVisibility'>",
                "<span class='name'> Display : </span>",
                "<span class='displayAllBtn' data-type='all'>",
                    "<i class='fa fa-check-square-o'></i> All",
                "</span>",
                "<span class='displayAllBtn' data-type='none'>",
                    "<i class='fa fa-square-o'></i> None",
                "</span>",
            "</span>",
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
        _self.elem.querySelector(".displayAllBtn[data-type='all'] i").className = _self.getIconClass('displayAll');
        _self.elem.querySelector(".displayAllBtn[data-type='none'] i").className = _self.getIconClass('displayNone');
         
        // Binding events
        // this.elem.querySelector(".addAnnotationGroupBtn").addEventListener('click', this.onClickNewAnnotation);
        this.elem.querySelectorAll(".displayAllBtn").forEach(function(elem){
            elem.addEventListener('click', this.onClickChangeAllVisibility);
        }.bind(this));
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
}





