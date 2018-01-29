;(function () {
  const hasCustomPropertiesSupport = (function () {
    let result = null
    return () => {
      if (result === null) {
        const elem = document.createElement('div')
        elem.classList.add('check-custom-properties-support')
        document.body.appendChild(elem)

        result = window.getComputedStyle(elem).display === 'block'
        document.body.removeChild(elem)
      }
      return result
    }
  })()

  const radiusPropertyName = '--circle-radius'
  const anglePropertyName = '--circle-angle'
  const itemEasingInClass = 'ring-item--easing-in'

  // ##########################
  // ##   Ring Item Object   ##
  // ##########################
  const ringItemDefaultOptions = {
    cssClass: 'ring-item',
    animateCreation: false
  }
  const animationEndHandler = event => {
    event.target.classList.remove(itemEasingInClass)
    event.target.removeEventListener('animationend', animationEndHandler)
  }

  function RingItem (nodeElem, angle, options) {
    this.options = Object.assign({}, ringItemDefaultOptions, options)
    this.div = nodeElem
    this.div.classList.add(this.options.cssClass)
    this.setAngle(angle)
    this.div.classList.add(itemEasingInClass)
    this.div.addEventListener('animationend', animationEndHandler)
  }

  RingItem.prototype = {
    _buildTransform () {
      return `translate(-50%, -50%) rotate(${this.angle}deg) translateX(${this.options.ringOptions.radius}) rotate(${-this.angle}deg)`
    },
    setAngle (angle) {
      this.angle = parseInt(angle, 10)
      if (!this.options.ringOptions.forceCSSCustomProperties && hasCustomPropertiesSupport()) {
        this.div.style.setProperty(anglePropertyName, `${this.angle}deg`)
      } else {
        console.log(this.div, angle, this._buildTransform());
        this.div.style.setProperty('transform', this._buildTransform())
      }
    },
    getAngle () {
      return this.angle
    }
  }

  // #####################
  // ##   Ring Object   ##
  // #####################
  const ringDefaultOptions = {
    cssClass: 'ring-service',
    radius: '500px',
    angleSeed: -90,
    spreadTop: 0,
    alignFirstItemTop: true,
    forceCSSCustomProperties: false
  }

  function Ring (containerNodeElement, itemsSelector, options) {
    const self = this
    this.div = containerNodeElement
    this.itemsSelector = itemsSelector
    this.options = Object.assign({}, ringDefaultOptions, options)
    this.items = []
    this.div.classList.add(this.options.cssClass)

    if (this.options.angleSeed === 'random') {
      this.angleSeed = 359 * Math.random()
    } else {
      this.angleSeed = this.options.angleSeed
    }

    if (typeof this.options.radius === 'number') {
      this.options.radius = this.options.radius + 'px'
    }

    if (!this.options.forceCSSCustomProperties && hasCustomPropertiesSupport()) {
      this.div.style.setProperty(radiusPropertyName, this.options.radius)
    } else {
      const padding = this.div.getBoundingClientRect().height / 2 - parseInt(this.options.radius, 10)
      this.div.style.padding = `${padding}px`
    }

    // Init all child
    const items = this.div.querySelectorAll(this.itemsSelector)
    const angleInfo = this._getAngleInfo(items.length)
    this.items = [ ...items ].map(function (item, index) {
      return new RingItem(item, self._getItemAngle(index, angleInfo), {
        ringOptions: self.options
      })
    })
  }


  Ring.prototype = {
    _getAngleInfo (overrideItemLength) {
      let spreadTop = this.options.spreadTop
      let itemsSpread = (360 - this.options.spreadTop) / ((overrideItemLength || this.items.length) - 1)

      if (spreadTop < itemsSpread) {
        spreadTop = 0
        itemsSpread = 360 / (overrideItemLength || this.items.length)
      }

      return { angleSeed: this.angleSeed, spreadTop, itemsSpread }
    },
    _getItemAngle (index, { angleSeed, spreadTop, itemsSpread }) {
      return Math.round(angleSeed + (spreadTop / 2) + (index + 0.5 * (spreadTop === 0 && !this.options.alignFirstItemTop)) * itemsSpread)
    },
    refreshAngles (angleInfo) {
      const self = this
      angleInfo = angleInfo || this._getAngleInfo()
      this.items.forEach((item, index) => {
        item.setAngle(self._getItemAngle(index, angleInfo))
      })
    },
    insertItem (nodeElement, index) {
      if (index >= this.items.length) {
        index = this.items.length
      }
      const angleInfo = this._getAngleInfo(this.items.length + 1)
      const newItemAngle = this._getItemAngle(index, angleInfo)
      const newRingItem = new RingItem(nodeElement, newItemAngle, {
        animateCreation: true,
        ringOptions: this.options
      })

      if (index < this.items.length) {
        this.div.insertBefore(newRingItem.div, this.div.querySelectorAll(this.itemsSelector)[ index ])
      } else {
        this.div.appendChild(newRingItem.div)
      }
      this.items.splice(index, 0, newRingItem)
      this.refreshAngles(angleInfo)

      return newRingItem
    },
    pushItem (nodeElement) {
      return this.insertItem(nodeElement, Infinity)
    },
    removeItem (index) {
      if (index < 0) {
        index = 0
      } else if (index >= this.items.length) {
        index = this.items.length - 1
      }
      this.div.removeChild(this.items[ index ].div)
      const removedItem = this.items.splice(index, 1)
      this.refreshAngles()
      return removedItem[ 0 ].div
    },
    popItem () {
      return this.removeItem(Infinity)
    }
  }

  window.Ring = Ring
})()
