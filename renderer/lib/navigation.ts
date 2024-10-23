// TODO
function initNavigation() {
  let masterElement: any = window;

  function Naviboard() {
    this.currentEvent = null;
    this.componentRendered = null;
    this.matrixForNavigation = null;
    this.currentX = 0;
    this.currentY = 0;
    this.activeElement = null;
    this.prevComponentRendered = [];
    this.prevActiveElement = [];
    this.nextComponentRendered = null;
    this.arrayOfCoordinates = [];
    this.initialOffsetX = 0;
    this.initialOffsetY = 0;
    this.resume = true;
    this.matrixWidth = 0;
    this.matrixHeight = 0;
  }

  Naviboard.prototype._getLocationOfActiveElement = function (elem) {
    if (this.matrixForNavigation != null) {
      for (let i = 0; i < this.matrixForNavigation.length; i++) {
        for (let j = 0; j < this.matrixForNavigation[0].length; j++) {
          if (this.matrixForNavigation[i][j] === elem) {
            return [i, j];
          }
        }
      }
    }
    return [0, 0];
  };

  function createArray(length) {
    const arr = new Array(length || 0);
    let i = length;
    if (arguments.length > 1) {
      // eslint-disable-next-line prefer-rest-params
      const args = Array.prototype.slice.call(arguments, 1);
      while (i--) arr[length - 1 - i] = createArray.apply(this, args);
    }
    return arr;
  }

  function fillNavigationArray(temp1, temp2, t_width, t_height) {
    const arrToFill = Array.from(Object.create(temp2));
    const obj = temp1;
    function _expandElement(toFill, elem, x, y, m, n) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
          toFill[x + i][y + j] = elem;
        }
      }
    }
    if (obj !== undefined && Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        for (let j = 0; j < obj[i].length; j++) {
          let elemWidth;
          let elemHeight;
          if (obj[i][j] != null) {
            elemWidth = Math.round(obj[i][j].offset.width / t_width);
            elemHeight = Math.round(obj[i][j].offset.height / t_height);
          }
          if (obj[i][j] !== null && (elemWidth > 1 || elemHeight > 1)) {
            _expandElement(
              arrToFill,
              obj[i][j].elementToFocus,
              i,
              j,
              elemWidth,
              elemHeight
            );
          } else if (obj[i][j] !== null) {
            arrToFill[i][j] = obj[i][j].elementToFocus;
          } else {
            // "Its null and non expanding!!
          }
        }
      }
    }
    return arrToFill;
  }

  Naviboard.prototype.makeNavigationRulesForComponent = function (
    obj,
    row,
    column
  ) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    // @ts-ignore
    const navArray = JSON.parse(JSON.stringify(createArray(row, column)));

    const _getMatrixForNavigation = new Promise((resolve, reject) => {
      const threshold_width = this.matrixWidth / column;
      const threshold_height = this.matrixHeight / row;

      const sortByCoordinates = function (list) {
        for (let i = 0; i < list.length; i++) {
          list[i].iValue = list.length * list[i].offset.x + list[i].offset.y;
        }
        list.sort(function (a, b) {
          return a.offset.y < b.offset.y ? -1 : a.offset.y > b.offset.y ? 1 : 0; // sort vertically
        });

        const sorted_by_x = [];
        let arr_to_push = [];
        let _INIT = false;
        for (let i = 0; i < list.length; i++) {
          if (!_INIT) {
            arr_to_push.push(list[i]);
            _INIT = true;
          } else {
            if (
              list[i].offset.y > arr_to_push[arr_to_push.length - 1].offset.y &&
              i !== list.length - 1
            ) {
              sorted_by_x.push(arr_to_push);
              arr_to_push = [];
              arr_to_push.push(list[i]);
            } else if (i === list.length - 1) {
              if (
                list[i].offset.y > arr_to_push[arr_to_push.length - 1].offset.y
              ) {
                sorted_by_x.push(arr_to_push);
                arr_to_push = [];
                arr_to_push.push(list[i]);
                sorted_by_x.push(arr_to_push);
              } else {
                arr_to_push.push(list[i]);
                sorted_by_x.push(arr_to_push);
              }
            } else {
              arr_to_push.push(list[i]);
            }
          }
        }
        if (arr_to_push.length > 0 && sorted_by_x.length === 0) {
          sorted_by_x.push(arr_to_push);
        }

        for (let j = 0; j < sorted_by_x.length; j++) {
          sorted_by_x[j].sort(function (a, b) {
            return a.offset.x < b.offset.x
              ? -1
              : a.offset.x > b.offset.x
              ? 1
              : 0; // sort horizontally
          });
        }

        const value_x = [
          ...new Set(
            sorted_by_x.reduce(
              (a, c) => a.concat(c.map(({ offset: { x } }) => x)),
              []
            )
          ),
        ].sort((a: any, b: any) => a - b);

        sorted_by_x.forEach((row) => {
          value_x.forEach((x, i) => {
            if (row[i] === undefined || row[i].offset.x > x) {
              row.splice(i, 0, null);
            }
          });
        });
        return sorted_by_x;
      };

      resolve(
        fillNavigationArray(
          sortByCoordinates(obj),
          navArray,
          threshold_width,
          threshold_height
        )
      );
      reject("Error in getting matrix for navigation.");
    });

    _getMatrixForNavigation.then(
      (matrix) => {
        self.matrixForNavigation = matrix;
        if (
          self.matrixForNavigation != null &&
          self.matrixForNavigation.length !== 0
        ) {
          let prev_component_back = false;
          if (
            self.prevComponentRendered.length >= 2 &&
            self.prevActiveElement.length >= 2
          ) {
            if (
              self.prevComponentRendered[
                self.prevComponentRendered.length - 2
              ] === self.nextComponentRendered &&
              self.prevComponentRendered[
                self.prevComponentRendered.length - 2
              ] != null &&
              self.nextComponentRendered != null
            ) {
              const coordsOfPreviousElement =
                self.prevActiveElement[self.prevActiveElement.length - 2];
              self.currentX = coordsOfPreviousElement[0];
              self.currentY = coordsOfPreviousElement[1];
              prev_component_back = true;
            }
          }
          if (
            self.matrixForNavigation.length < self.currentX &&
            self.matrixForNavigation[0].length < self.currentY
          ) {
            for (let j = 0; j < self.matrixForNavigation[0].length; j++) {
              if (self.matrixForNavigation[0][j] != null) {
                self.currentX = 0;
                self.currentY = j;
                self.activeElement =
                  self.matrixForNavigation[self.currentX][self.currentY];
                self.activeElement.focus();
                break;
              }
            }
          } else if (
            self.matrixForNavigation.length > self.currentX &&
            self.matrixForNavigation[0].length > self.currentY &&
            prev_component_back
          ) {
            self.activeElement =
              self.matrixForNavigation[self.currentX][self.currentY];
            self.activeElement.focus();
          } else if (
            self.matrixForNavigation.length > self.currentX &&
            self.matrixForNavigation[0].length > self.currentY
          ) {
            for (let j = 0; j < self.matrixForNavigation[0].length; j++) {
              if (self.matrixForNavigation[0][j] != null) {
                self.currentX = 0;
                self.currentY = j;
                self.activeElement =
                  self.matrixForNavigation[self.currentX][self.currentY];
                self.activeElement.focus();
                break;
              }
            }
          } else {
            for (let j = 0; j < self.matrixForNavigation[0].length; j++) {
              if (self.matrixForNavigation[0][j] != null) {
                self.currentX = 0;
                self.currentY = j;
                self.activeElement =
                  self.matrixForNavigation[self.currentX][self.currentY];
                self.activeElement.focus();
                break;
              }
            }
          }
        }
      },
      (err) => {
        console.log(err);
      }
    );
  };

  Naviboard.prototype.destroyCurrentNavigationView = function (id, status) {
    if (status === "destroy") {
      this.prevComponentRendered.push(this.componentRendered);
      if (this.prevComponentRendered.length >= 5) {
        this.prevComponentRendered = this.prevComponentRendered.slice(
          Math.max(this.prevComponentRendered.length - 5, 2)
        );
      }
      this.prevActiveElement.push(
        this._getLocationOfActiveElement(this.activeElement)
      );
      if (this.prevActiveElement.length >= 5) {
        this.prevActiveElement = this.prevActiveElement.slice(
          Math.max(this.prevActiveElement.length - 5, 2)
        );
      }
      this.componentRendered = null;
    }
    this.arrayOfCoordinates = [];
    xFilled = [];
    yFilled = [];
    this.initialOffsetX = 0;
    this.initialOffsetY = 0;
    this.matrixForNavigation = null;
    this.currentX = 0;
    this.currentY = 0;
    this.activeElement = null;
    this.currentEvent = null;
    return true;
  };

  let xFilled = [];
  let yFilled = [];
  function findMinMaxWidth(arr) {
    let min_left = arr[0].offset.left,
      max_right = arr[0].offset.right;
    let min_top = arr[0].offset.top,
      max_bottom = arr[0].offset.bottom;

    for (let i = 1, len = arr.length; i < len; i++) {
      const v = arr[i].offset.left;
      const p = arr[i].offset.top;
      const u = arr[i].offset.right;
      const q = arr[i].offset.bottom;
      min_left = v < min_left ? v : min_left;
      min_top = p < min_top ? p : min_top;
      max_right = u > max_right ? u : max_right;
      max_bottom = q > max_bottom ? q : max_bottom;
    }
    return [max_right - min_left, max_bottom - min_top]; // [width, height]
  }

  Naviboard.prototype.increaseRowCountIfRequired = function (offset, rowcount) {
    offset.y = Math.round(offset.y);
    if (offset.y > this.initialOffsetY && offset.y > Math.max(...yFilled)) {
      this.initialOffsetY = offset.y;
      yFilled.push(offset.y);
      return rowcount + 1;
    } else if (offset.y < this.initialOffsetY && !yFilled.includes(offset.y)) {
      this.initialOffsetY = offset.y;
      yFilled.push(offset.y);
      return rowcount + 1;
    } else {
      return rowcount;
    }
  };

  Naviboard.prototype.increaseColumnCountIfRequired = function (
    offset,
    columnCount
  ) {
    offset.x = Math.round(offset.x);

    if (offset.x > this.initialOffsetX && offset.x > Math.max(...xFilled)) {
      this.initialOffsetX = offset.x;
      xFilled.push(offset.x);
      return columnCount + 1;
    } else if (offset.x < this.initialOffsetX && !xFilled.includes(offset.x)) {
      this.initialOffsetX = offset.x;
      xFilled.push(offset.x);
      return columnCount + 1;
    } else {
      return columnCount;
    }
  };

  Naviboard.prototype.handleView = function (elementIdOfComponentDOM) {
    
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.arrayOfCoordinates = [];
    self.componentRendered = elementIdOfComponentDOM;
    let childNodes = [];
    const _getAllChildNodes = new Promise((resolve, reject) => {
      masterElement = document.getElementById(elementIdOfComponentDOM);
      childNodes = masterElement.getElementsByClassName("navigable");
      resolve(childNodes);
      reject("Error in resolving child nodes!");
    });

    _getAllChildNodes.then(
      (children: any) => {
        let row = 0;
        let column = 0;

        for (let i = 0; i < children.length; i++) {
          children[i].tabIndex =
            children[i].tabIndex === -1 ? 0 : children[i].tabIndex;
          const offsetXY = children[i].getBoundingClientRect();
          row = self.increaseRowCountIfRequired(offsetXY, row);
          column = self.increaseColumnCountIfRequired(offsetXY, column);
          self.arrayOfCoordinates.push({
            offset: offsetXY,
            elementToFocus: children[i],
          });
        }
        self.matrixWidth = findMinMaxWidth(self.arrayOfCoordinates)[0];
        self.matrixHeight = findMinMaxWidth(self.arrayOfCoordinates)[1];
        self.makeNavigationRulesForComponent(
          self.arrayOfCoordinates,
          row,
          column
        );
      },
      (err) => {
        console.log(err);
      }
    );
  };

  const naviBoard = new Naviboard();

  naviBoard.getActiveElement = function () {
    return this.activeElement;
  };

  naviBoard.setNavigation = function (id) {
    if (this.matrixForNavigation === null) {
      this.nextComponentRendered = id;
      this.handleView(id);
    } else {
      // console.log("Destroy the previous navigation first!");
    }
  };

  naviBoard.destroyNavigation = function (id) {
    this.destroyCurrentNavigationView(id, "destroy");
  };

  naviBoard.getCurrentEvent = function () {
    return this.currentEvent;
  };

  naviBoard.refreshNavigation = function (id, status) {
    if (status === "refresh") {
      this.prevComponentRendered.push(this.componentRendered);
      this.prevActiveElement.push(
        this._getLocationOfActiveElement(this.activeElement)
      );
      const refreshStatus = this.destroyCurrentNavigationView(id, "destroy");
      if (refreshStatus) {
        this.handleView(id);
      }
    } else {
      let refreshStatus = false;
      refreshStatus = this.destroyCurrentNavigationView(id, status);
      if (refreshStatus) {
        this.handleView(id);
      }
    }
  };

  naviBoard.getNavigationComponent = function () {
    return this.componentRendered;
  };

  naviBoard.resumeNavigation = function () {
    this.resume = true;
  };

  naviBoard.pauseNavigation = function () {
    this.resume = false;
  };

  const handleKeyDown = function (event) {
    // console.log('this.matrixForNavigation:', this.matrixForNavigation)
    // console.log('this.resume:', this.resume)
    if (this.matrixForNavigation !== null && this.resume) {
      const maxHeight = this.matrixForNavigation.length;
      const maxWidth = this.matrixForNavigation[0].length;

      const check_the_left = function () {
        // eslint-disable-next-line prefer-rest-params
        let _column = arguments[1];
        while (_column >= 0) {
          if (
            // eslint-disable-next-line prefer-rest-params
            this.matrixForNavigation[arguments[0]][_column] !== undefined &&
            // eslint-disable-next-line prefer-rest-params
            this.matrixForNavigation[arguments[0]][_column] !== null
          ) {
            this.activeElement.blur();
            // eslint-disable-next-line prefer-rest-params
            this.currentX = arguments[0];
            this.currentY = _column;
            this.activeElement =
              this.matrixForNavigation[this.currentX][this.currentY];
            this.activeElement.focus();
            return true;
          }
          _column--;
        }
        return false;
      }.bind(this);

      const check_the_right = function () {
        // eslint-disable-next-line prefer-rest-params
        let _column = arguments[1];
        while (_column < maxWidth) {
          if (
            // eslint-disable-next-line prefer-rest-params
            this.matrixForNavigation[arguments[0]][_column] !== undefined &&
            // eslint-disable-next-line prefer-rest-params
            this.matrixForNavigation[arguments[0]][_column] !== null
          ) {
            this.activeElement.blur();
            // eslint-disable-next-line prefer-rest-params
            this.currentX = arguments[0];
            this.currentY = _column;
            this.activeElement =
              this.matrixForNavigation[this.currentX][this.currentY];
            this.activeElement.focus();
            return true;
          }
          _column++;
        }
        return false;
      }.bind(this);

      const check_the_top = function () {
        // eslint-disable-next-line prefer-rest-params
        let _row = arguments[0];
        while (_row >= 0) {
          if (
            // eslint-disable-next-line prefer-rest-params
            this.matrixForNavigation[_row][arguments[1]] !== undefined &&
            // eslint-disable-next-line prefer-rest-params
            this.matrixForNavigation[_row][arguments[1]] !== null
          ) {
            this.activeElement.blur();
            // eslint-disable-next-line prefer-rest-params
            this.currentY = arguments[1];
            this.currentX = _row;
            this.activeElement =
              this.matrixForNavigation[this.currentX][this.currentY];
            this.activeElement.focus();
            return true;
          }
          _row--;
        }
        return false;
      }.bind(this);

      const check_the_bottom = function () {
        
        // eslint-disable-next-line prefer-rest-params
        let _row = arguments[0];
        while (_row < maxHeight) {
          if (
            // eslint-disable-next-line prefer-rest-params
            this.matrixForNavigation[_row][arguments[1]] !== undefined &&
            // eslint-disable-next-line prefer-rest-params
            this.matrixForNavigation[_row][arguments[1]] !== null
          ) {
            this.activeElement.blur();
            // eslint-disable-next-line prefer-rest-params
            this.currentY = arguments[1];
            this.currentX = _row;
            this.activeElement =
              this.matrixForNavigation[this.currentX][this.currentY];
            this.activeElement.focus();
            return true;
          }
          _row++;
        }
        return false;
      }.bind(this);

      if (
        this.matrixForNavigation != null &&
        this.matrixForNavigation.length != 0
      ) {
        this.currentEvent = event;
        if (event.keyCode == 40) {
          console.log('downdowndown')
          //Navigating down in vertical direction
          if (this.currentX + 1 >= maxHeight) {
            //"Nothing is DOWN!"
            console.log("Nothing is DOWN!")
          } else if (
            this.matrixForNavigation[this.currentX + 1][this.currentY] !=
              undefined &&
            this.matrixForNavigation[this.currentX + 1][this.currentY] !=
              this.activeElement
          ) {
            this.activeElement.blur();
            this.currentX = this.currentX + 1;
            this.activeElement =
              this.matrixForNavigation[this.currentX][this.currentY];
            this.activeElement.focus();
          } else if (
            this.matrixForNavigation[this.currentX + 1][this.currentY] !==
              undefined &&
            this.matrixForNavigation[this.currentX + 1][this.currentY] !=
              this.activeElement &&
            this.matrixForNavigation[this.currentX + 1][this.currentY] === null
          ) {
            let bottom = this.currentX + 1;
            let found = false;
            while (bottom < maxHeight) {
              if (this.matrixForNavigation[bottom][this.currentY] != null) {
                this.activeElement.blur();
                this.currentX = bottom;
                this.activeElement =
                  this.matrixForNavigation[this.currentX][this.currentY];
                this.activeElement.focus();
                found = true;
                break;
              }
              bottom++;
            }

            if (this.currentY >= 0 && !found) {
              const check = check_the_left(this.currentX + 1, this.currentY);
              if (check == false) {
                check_the_right(this.currentX + 1, this.currentY);
              }
            }
          } else if (
            this.matrixForNavigation[this.currentX + 1][this.currentY] ===
            this.activeElement
          ) {
            let bottom = this.currentX + 1;
            while (bottom < maxHeight) {
              if (
                this.matrixForNavigation[bottom][this.currentY] !=
                this.activeElement
              ) {
                this.activeElement.blur();
                this.currentX = bottom;
                this.activeElement =
                  this.matrixForNavigation[this.currentX][this.currentY];
                this.activeElement.focus();
                break;
              }
              bottom++;
            }
          } else {
            if (this.activeElement) {
              this.activeElement.blur();
              this.currentX = this.currentX + 1;
              this.activeElement =
                this.matrixForNavigation[this.currentX][this.currentY];
              this.activeElement?.focus();
            }
          }
        } else if (event.keyCode == 38) {
          if (this.currentX - 1 < 0) {
            //"Nothing is UP !!"
            console.log("Nothing is UP!")
          } else if (
            this.matrixForNavigation[this.currentX - 1][this.currentY] !=
              undefined &&
            this.matrixForNavigation[this.currentX - 1][this.currentY] !=
              this.activeElement
          ) {
            this.activeElement.blur();
            this.currentX = this.currentX - 1;
            this.activeElement =
              this.matrixForNavigation[this.currentX][this.currentY];
            this.activeElement.focus();
          } else if (
            this.matrixForNavigation[this.currentX - 1][this.currentY] !==
              undefined &&
            this.matrixForNavigation[this.currentX - 1][this.currentY] !=
              this.activeElement &&
            this.matrixForNavigation[this.currentX - 1][this.currentY] === null
          ) {
            let top = this.currentX - 1;
            let found = false;
            while (top >= 0) {
              if (this.matrixForNavigation[top][this.currentY] != null) {
                this.activeElement.blur();
                this.currentX = top;
                this.activeElement =
                  this.matrixForNavigation[this.currentX][this.currentY];
                this.activeElement.focus();
                found = true;
                break;
              }
              top--;
            }
            if (this.currentY >= 0 && !found) {
              const check = check_the_left(this.currentX - 1, this.currentY);
              if (check == false) {
                check_the_right(this.currentX - 1, this.currentY);
              }
            }
          } else if (
            this.matrixForNavigation[this.currentX - 1][this.currentY] ===
            this.activeElement
          ) {
            let top = this.currentX - 1;
            while (top >= 0) {
              if (
                this.matrixForNavigation[top][this.currentY] !=
                this.activeElement
              ) {
                this.activeElement.blur();
                this.currentX = top;
                this.activeElement =
                  this.matrixForNavigation[this.currentX][this.currentY];
                this.activeElement.focus();
                break;
              }
              top--;
            }
          }
        } else if (event.keyCode == 39) {
          if (this.currentY + 1 >= maxWidth) {
            //"Nothing is RIGHT !"
          } else if (
            this.matrixForNavigation[this.currentX][this.currentY + 1] !=
              undefined &&
            this.matrixForNavigation[this.currentX][this.currentY + 1] !=
              this.activeElement
          ) {
            this.activeElement.blur();
            this.currentY = this.currentY + 1;
            this.activeElement =
              this.matrixForNavigation[this.currentX][this.currentY];
            this.activeElement.focus();
          } else if (
            this.matrixForNavigation[this.currentX][this.currentY + 1] !==
              undefined &&
            this.matrixForNavigation[this.currentX][this.currentY + 1] !=
              this.activeElement &&
            this.matrixForNavigation[this.currentX][this.currentY + 1] === null
          ) {
            let found = false;
            let right = this.currentY + 1;
            while (right < maxWidth) {
              if (this.matrixForNavigation[this.currentX][right] != null) {
                this.activeElement.blur();
                this.currentY = right;
                this.activeElement =
                  this.matrixForNavigation[this.currentX][this.currentY];
                this.activeElement.focus();
                found = true;
                break;
              }
              right++;
            }

            if (this.currentY > 0 && !found) {
              const check = check_the_top(this.currentX, this.currentY + 1);
              if (check == false) {
                check_the_bottom(this.currentX, this.currentY + 1);
              }
            }
          } else if (
            this.matrixForNavigation[this.currentX][this.currentY + 1] ===
            this.activeElement
          ) {
            let right = this.currentY + 1;
            while (right < maxWidth) {
              if (
                this.matrixForNavigation[this.currentX][right] !=
                this.activeElement
              ) {
                this.activeElement.blur();
                this.currentY = right;
                this.activeElement =
                  this.matrixForNavigation[this.currentX][this.currentY];
                this.activeElement.focus();
                break;
              }
              right++;
            }
          }
        } else if (event.keyCode == 37) {
          if (this.currentY - 1 < 0) {
            //"Nothing is LEFT !!"
          } else if (
            this.matrixForNavigation[this.currentX][this.currentY - 1] !=
              undefined &&
            this.matrixForNavigation[this.currentX][this.currentY - 1] !=
              this.activeElement
          ) {
            this.activeElement.blur();
            this.currentY = this.currentY - 1;
            this.activeElement =
              this.matrixForNavigation[this.currentX][this.currentY];
            this.activeElement.focus();
          } else if (
            this.matrixForNavigation[this.currentX][this.currentY - 1] !==
              undefined &&
            this.matrixForNavigation[this.currentX][this.currentY - 1] !=
              this.activeElement &&
            this.matrixForNavigation[this.currentX][this.currentY - 1] === null
          ) {
            let left = this.currentY - 1;
            let found = false;
            while (left >= 0) {
              if (this.matrixForNavigation[this.currentX][left] != null) {
                this.activeElement.blur();
                this.currentY = left;
                this.activeElement =
                  this.matrixForNavigation[this.currentX][this.currentY];
                this.activeElement.focus();
                found = true;
                break;
              }
              left--;
            }

            if (this.currentX > 0 && !found) {
              const check = check_the_top(this.currentX, this.currentY - 1);
              if (check == false) {
                check_the_bottom(this.currentX, this.currentY - 1);
              }
            }
          } else if (
            this.matrixForNavigation[this.currentX][this.currentY - 1] ===
            this.activeElement
          ) {
            let left = this.currentY - 1;
            while (left >= 0) {
              if (
                this.matrixForNavigation[this.currentX][left] !=
                this.activeElement
              ) {
                this.activeElement.blur();
                this.currentY = left;
                this.activeElement =
                  this.matrixForNavigation[this.currentX][this.currentY];
                this.activeElement.focus();
                break;
              }
              left--;
            }
          }
        }
      }
    } else {
      console.log("Navigation is paused");
    }
  }.bind(naviBoard);

  masterElement.addEventListener("keydown", handleKeyDown, true);

  window.addEventListener("gamepadconnected", updateLoop);

  const rAF = window.requestAnimationFrame;
  function updateLoop() {
    const gp = navigator.getGamepads()[0];

    switch (true) {
      case gp.buttons[12].pressed:
        handleKeyDown({ keyCode: 38 });
        break;
      case gp.buttons[13].pressed:
        handleKeyDown({ keyCode: 40 });
        break;
      case gp.buttons[14].pressed:
        handleKeyDown({ keyCode: 37 });
        break;
      case gp.buttons[15].pressed:
        handleKeyDown({ keyCode: 39 });
        break;
      case gp.buttons[0].pressed: {
        const elem = naviBoard.getActiveElement();
        elem.click();
        break;
      }
      default:
        break;
    }

    setTimeout(function () {
      rAF(updateLoop);
    }, 150);
  }

  return naviBoard
}

export default initNavigation;
