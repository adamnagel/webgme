/*
 * Copyright (C) 2012 Vanderbilt University, All rights reserved.
 * 
 * Author: Miklos Maroti
 */

package org.isis.promise3;

public interface Promise<Type> {
	public void setParent(Observer<Type> parent);

	public void cancel(Exception error);
}