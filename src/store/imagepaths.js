// Storage object path. Convention enforced by storage RLS: first folder = user id.
export function storagePath(userId, projectId, img) {
  return `${userId}/${projectId}/${img.lp_index}/${img.slot_key}.jpg`;
}
