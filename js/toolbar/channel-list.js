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

    this.onClickedMenuHandler = function() {
      _self.parent.onClickedMenuHandler("channelList")
      _self.parent.dispatchEvent("hideChannelList");
    }

    // Render the view
    this.render = function(){

        var id,
            collection = this.collection,
            listElem = document.createElement("div");

        listElem.setAttribute("class", "channelList");
        if (collection,Object.keys(collection).length === 0 && collection.constructor === Object) {
          listElem.innerHTML = [
              "<div><span class='title'>Channels</span> <button class='dismiss-channel' title='dismiss'><i class='fa fa-times'></i></button></div>",
              "<div class='groups'> No Channels found",
              "</div>"
          ].join("");
        } else {
          listElem.innerHTML = [
              "<div><span class='title'>Channels</span> <button class='dismiss-channel' title='dismiss' style='border:none;background-color:transparent; float:right!important;'><i class='fa fa-times'></i></button></div>",
              "<div class='groups'>",
              "</div>"
          ].join("");
        }
        console.log("Collection are herre",  collection,Object.keys(collection).length === 0 && collection.constructor === Object);
        for(id in collection){
            if(collection[id].elem == null){
                collection[id].render();
            }
            listElem.querySelector(".groups").appendChild(collection[id].elem);
        }

        this.elem = listElem;

        this.elem.querySelectorAll(".dismiss-channel").forEach(function(elem){
            elem.addEventListener('click', this.onClickedMenuHandler);
        }.bind(this));

    }
}
