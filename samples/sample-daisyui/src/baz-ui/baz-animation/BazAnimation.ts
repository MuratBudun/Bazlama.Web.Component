export type TAnimationPatern = {
    keyFrames: Keyframe[],
    options?: KeyframeAnimationOptions
}

export default class BazAnimation {
    public static isActivated = true
    public static playbackSpeed = 2;
    public static animationLibraryStandart: { [key: string]: TAnimationPatern } = {
        fadeIn: {keyFrames: [{ opacity: 0 }, { opacity: 1 }], options: { duration: 1000 }},
        fadeOut: {keyFrames: [{ opacity: 1 }, { opacity: 0 }], options: { duration: 1000 }},
        test: {keyFrames: [{ opacity: 0, offset:.8 }, { opacity: 1 }], options: { duration: 1000 }},
        shake: { keyFrames: [
            { transform: "translate(1px, 1px) rotate(0deg)", offset: 0 },
            { transform: "translate(-1px, -2px) rotate(-1deg)", offset: 0.1 },
            { transform: "translate(-3px, 0px) rotate(1deg)", offset: 0.2 },
            { transform: "translate(3px, 2px) rotate(0deg)", offset: 0.3 },
            { transform: "translate(1px, -1px) rotate(1deg)", offset: 0.4 },
            { transform: "translate(-1px, 2px) rotate(-1deg)", offset: 0.5 },
            { transform: "translate(-3px, 1px) rotate(0deg)", offset: 0.6 },
            { transform: "translate(3px, 1px) rotate(-1deg)", offset: 0.7 },
            { transform: "translate(-1px, -1px) rotate(1deg)", offset: 0.8 },
            { transform: "translate(1px, 2px) rotate(0deg)", offset: 0.9 },
            { transform: "translate(1px, -2px) rotate(-1deg)", offset: 1 }            
        ], options: { duration: 500 }}
    }

    public static animationLibraries: { [key: string]: { [key: string]: TAnimationPatern } } = {
        standart: this.animationLibraryStandart
    }

    private static getAnimation(animationName: string, animationLibraryNames: string[] = ["standart"]): TAnimationPatern | null {
        for (const libraryName of animationLibraryNames) {
            if (this.animationLibraries[libraryName][animationName]) {
                return this.animationLibraries[libraryName][animationName]
            }
        }
        return null
    }

    public static animate(element: HTMLElement, animationName: string,
        options?: KeyframeAnimationOptions | undefined,
        animationLibraryNames: string[] = ["standart"],
        callback?: () => void): void 
    {
        if (!this.isActivated) {
            if (typeof callback === "function") {
                callback()
            }
            return
        }
        if (!element) return
        if (animationName === "") return
        if (typeof animationName !== "string") return
        
        const animation = this.getAnimation(animationName, animationLibraryNames)
        if (!animation) {
            console.warn(`Animation ${animationName} not found in libraries ${animationLibraryNames}`)
            return
        }

        const animationOptions:KeyframeAnimationOptions = { ...animation.options, ...options }

        if (this.playbackSpeed != 1 && animationOptions.hasOwnProperty("duration")) {
            animationOptions.duration = Number(Number(animationOptions.duration) /  this.playbackSpeed)
        }
        
        element.animate(animation.keyFrames, animationOptions).finished.then(() => {
            if (typeof callback === "function") {
                callback()
            }
        })
    }
}

