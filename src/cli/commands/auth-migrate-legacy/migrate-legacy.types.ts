export interface MigrateLegacyOptions {
    /** Called when the client is new to the store, to name the profile it becomes. */
    chooseProfileName: (suggestion: string) => Promise<string>
}

export type MigrateLegacyResult =
    | { status: 'nothing-to-migrate' }
    | {
          status: 'migrated'
          profile: string
          profileCreated: boolean
          /** False when the project has no refresh token, or the store already holds its default connection. */
          tokensMoved: boolean
          /** The profile of the connection the project uses after the run, which kept tokens may tie to another client. */
          connectionProfile: string | null
      }
