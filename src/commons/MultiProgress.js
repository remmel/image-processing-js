export class MultiProgress {

  constructor(onProgressMother) {
    this.percentages = []
    this.length = 0
    this.onProgressMother = onProgressMother
  }

  /**
   * Create a new sub progress bar
   */
  add() {
    let idx = this.length
    this.length++
    this.percentages[idx] = 0
    return percentage => {
      this.percentages[idx] = percentage
      this.update()
    }
  }

  update() {
    let sum = this.percentages.reduce((acc, val) => acc + val, 0)
    this.onProgressMother(sum/this.length) //average, all progress bar, have same importance (eg if 2: 50%/50%, if 3: 33%/33%/33%, ...)
    // console.log(sum, this.length, this.percentages.length)
  }
}