function ChannelList(parent){

    var _self = this;
    
    this.elem = null;
    this.collection = {};
    this.parent = parent || null;

    // Add new annotation items
    this.add = function(items){
        var id,
            item,
            i;
            
        for(i = 0; i < items.length; i++){
            id = items[i].osdItemId;

            if(!this.collection.hasOwnProperty(id)){
                item = new ChannelItem({
                    name : items[i]["name"],
                    contrast : items[i]["contrast"],
                    brightness : items[i]["brightness"],
                    gamma : items[i]["gamma"],
                    hue : items[i]["hue"],
                    osdItemId : id,
                    parent : _self
                });
                
                this.collection[id] = item;
    
                if(this.elem != null){
                    item.render();
                    this.elem.querySelector(".groups").appendChild(item.elem);
                };
            }
        }
    }
    
    // Dispatch the event to the parent
    this.dispatchEvent = function(type, data){
        this.parent.dispatchEvent(type, data);
    }

    // Render the view 
    this.render = function(){

        var id,
            collection = this.collection,
            listElem = document.createElement("div");

        listElem.setAttribute("class", "channelList");
        listElem.innerHTML = [
            // "<span class='title'>Channels</span>",
            "<div class='groups'>",
            "</div>"
        ].join("");

        for(id in collection){
            if(collection[id].elem == null){
                collection[id].render();
            }
            listElem.querySelector(".groups").appendChild(collection[id].elem);
        }

        this.elem = listElem;
    }
}





